<#
.SYNOPSIS
    Complete Production App Setup for Kind + ArgoCD
.DESCRIPTION
    Sets up full DevOps environment (Docker + Kind + ArgoCD + Kubernetes)
    Includes: Metrics Server, ArgoCD server-side apply, NodePort fix, AppProject + Application
#>

param(
    [switch]$SkipDockerBuild,
    [switch]$SkipClusterCreate,
    [switch]$SkipArgoCD
)

$ErrorActionPreference = "Stop"

# ==============================
# Helper Functions
# ==============================
function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-NodesReady {
    Write-Host "Waiting for nodes to be Ready..." -ForegroundColor Yellow
    $timeout = 120
    $elapsed = 0
    do {
        $notReady = kubectl get nodes --no-headers 2>$null | Select-String "NotReady"
        if (-not $notReady) {
            Write-Host "All nodes are Ready" -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "  Still waiting... ($elapsed/$timeout s)" -ForegroundColor Yellow
    } while ($elapsed -lt $timeout)
    throw "Nodes did not become Ready within $timeout seconds"
}

function Wait-DeploymentReady {
    param([string]$Deployment, [string]$Namespace, [int]$Timeout = 180)
    Write-Host "Waiting for $Deployment in $Namespace..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout="${Timeout}s" deployment/$Deployment -n $Namespace
    if ($LASTEXITCODE -ne 0) { throw "$Deployment did not become ready in time" }
}

# ==============================
# 1. CHECK PREREQUISITES
# ==============================
Write-Step "Checking Prerequisites"

$required = @("docker", "kubectl", "kind")
foreach ($cmd in $required) {
    if (-not (Test-Command $cmd)) {
        Write-Error "$cmd is not installed or missing in PATH"
        exit 1
    }
    Write-Host "OK: $cmd found" -ForegroundColor Green
}

try {
    docker info | Out-Null
    Write-Host "OK: Docker running" -ForegroundColor Green
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# ==============================
# 2. BUILD DOCKER IMAGES
# ==============================
if (-not $SkipDockerBuild) {
    Write-Step "Building Docker Images"

    # Bust COPY layer cache so new source files are always picked up
    (Get-Date).ToString() | Out-File .\frontend\src\.buildtime
    (Get-Date).ToString() | Out-File .\backend\src\.buildtime

    docker build -t production-backend:latest ./backend
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

    docker build -t production-frontend:latest ./frontend
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

    Write-Host "Docker images built successfully" -ForegroundColor Green
} else {
    Write-Host "Skipping Docker build" -ForegroundColor Yellow
}

# ==============================
# 3. CREATE KIND CLUSTER
# ==============================
if (-not $SkipClusterCreate) {
    Write-Step "Creating Kind Cluster"

    $exists = kind get clusters 2>$null | Select-String "production-cluster"
    if ($exists) {
        Write-Host "Deleting existing cluster..." -ForegroundColor Yellow
        kind delete cluster --name production-cluster
    }

    kind create cluster --config kind-config.yaml --name production-cluster
    if ($LASTEXITCODE -ne 0) { throw "Kind cluster creation failed" }

    kubectl cluster-info --context kind-production-cluster

    # Wait for nodes to be fully Ready before proceeding
    Wait-NodesReady

    kubectl get nodes
    Write-Host "Kind cluster ready" -ForegroundColor Green
} else {
    Write-Host "Skipping cluster creation" -ForegroundColor Yellow
    kubectl config use-context kind-production-cluster
}

# ==============================
# 4. LOAD IMAGES INTO KIND
# ==============================
Write-Step "Loading Images into Kind"

kind load docker-image production-backend:latest --name production-cluster
kind load docker-image production-frontend:latest --name production-cluster

Write-Host "Images loaded" -ForegroundColor Green

# ==============================
# 5. NGINX INGRESS
# ==============================
Write-Step "Installing NGINX Ingress"

kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml

kubectl wait --namespace ingress-nginx `
    --for=condition=ready pod `
    --selector=app.kubernetes.io/component=controller `
    --timeout=120s

Write-Host "Ingress ready" -ForegroundColor Green

# ==============================
# 6. METRICS SERVER
# ==============================
Write-Step "Installing Metrics Server"

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for Kind: disable kubelet TLS verification (required for local clusters)
Start-Sleep -Seconds 5
kubectl patch deployment metrics-server -n kube-system --type=json `
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

# Wait for metrics-server to be ready
kubectl wait --for=condition=available --timeout=120s deployment/metrics-server -n kube-system
Write-Host "Metrics Server ready" -ForegroundColor Green

# ==============================
# 7. ARGOCD INSTALL
# ==============================
if (-not $SkipArgoCD) {
    Write-Step "Installing ArgoCD"

    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    # Use --server-side to avoid CRD annotation size limit (262144 bytes exceeded otherwise)
    kubectl apply -n argocd `
        -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml `
        --server-side --force-conflicts

    Wait-DeploymentReady -Deployment "argocd-server" -Namespace "argocd" -Timeout 300

    # Patch ArgoCD service to NodePort (PowerShell-safe JSON escaping)
    kubectl patch svc argocd-server -n argocd --type=merge `
        -p "{`"spec`":{`"type`":`"NodePort`"}}"

    # Verify patch worked, fallback to replace if needed
    $svcType = kubectl get svc argocd-server -n argocd -o jsonpath="{.spec.type}"
    if ($svcType -ne "NodePort") {
        Write-Host "Patch via merge failed, trying replace..." -ForegroundColor Yellow
        kubectl get svc argocd-server -n argocd -o json `
            | ForEach-Object { $_ -replace '"type": "ClusterIP"', '"type": "NodePort"' } `
            | kubectl replace -f -
    }

    # Apply AppProject and Application
    Write-Host "Applying ArgoCD AppProject and Application..." -ForegroundColor Yellow
    kubectl apply -f .\argocd\projects\app-project.yaml
    kubectl apply -f .\argocd\projects\root-app.yaml

    # Apply ArgoCD Ingress
    kubectl apply -f .\argocd-ingress.yaml

    # Get admin password
    $argoPassword = kubectl -n argocd get secret argocd-initial-admin-secret `
        -o jsonpath="{.data.password}" `
        | ForEach-Object { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }

    Write-Host "ArgoCD Ready!" -ForegroundColor Green
    Write-Host "URL: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "User: admin" -ForegroundColor Cyan
    Write-Host "Pass: $argoPassword" -ForegroundColor Yellow

    # Port-forward ArgoCD in background
    Start-Process powershell -ArgumentList "-NoExit -Command kubectl port-forward svc/argocd-server -n argocd 8080:80"
} else {
    Write-Host "Skipping ArgoCD" -ForegroundColor Yellow
}

# ==============================
# 8. DEPLOY APPLICATION
# ==============================
Write-Step "Deploying Application"

kubectl apply -k k8s/base

Wait-DeploymentReady -Deployment "backend" -Namespace "production-app" -Timeout 180
Wait-DeploymentReady -Deployment "frontend" -Namespace "production-app" -Timeout 180

# ==============================
# 9. PORT FORWARDS
# ==============================
Write-Step "Starting Port Forwards"

# Frontend on 3002, Backend on 3001
Start-Process powershell -ArgumentList "-NoExit -Command kubectl port-forward svc/frontend -n production-app 3002:80"
Start-Process powershell -ArgumentList "-NoExit -Command kubectl port-forward svc/backend -n production-app 3001:3000"

Start-Sleep -Seconds 3

# ==============================
# 10. VERIFY
# ==============================
Write-Step "Verification"

kubectl get pods -n production-app
Write-Host ""
kubectl get svc -n production-app
Write-Host ""
kubectl get ingress -n production-app
Write-Host ""
kubectl get hpa -n production-app

if (-not $SkipArgoCD) {
    Write-Host ""
    kubectl get application -n argocd
    kubectl get appproject -n argocd
}

# ==============================
# 11. ACCESS INFO
# ==============================
Write-Step "Access Info"

Write-Host "Frontend:  http://localhost:3002" -ForegroundColor Cyan
Write-Host "           Login: admin / admin" -ForegroundColor White
Write-Host "Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "Health:    http://localhost:3001/health" -ForegroundColor Cyan

if (-not $SkipArgoCD) {
    Write-Host "ArgoCD:    http://localhost:8080" -ForegroundColor Cyan
    Write-Host "           User: admin" -ForegroundColor White
    Write-Host "           Pass: $argoPassword" -ForegroundColor Yellow
    Write-Host "ArgoCD Ingress: http://argocd.localhost" -ForegroundColor Cyan
}

Write-Host "`nDONE - Cluster is ready" -ForegroundColor Green
Write-Host "Run: kubectl get all -n production-app" -ForegroundColor Yellow
