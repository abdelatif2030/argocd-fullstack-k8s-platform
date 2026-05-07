<#
.SYNOPSIS
    Complete Production App Setup for Kind + ArgoCD
.DESCRIPTION
    Sets up full DevOps environment (Docker + Kind + ArgoCD + Kubernetes)
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
    Write-Error "Docker is not running"
    exit 1
}

# ==============================
# 2. BUILD DOCKER IMAGES
# ==============================
if (-not $SkipDockerBuild) {
    Write-Step "Building Docker Images"

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

    $exists = kind get clusters | Select-String "production-cluster"
    if ($exists) {
        kind delete cluster --name production-cluster
    }

    kind create cluster --config kind-config.yaml --name production-cluster
    if ($LASTEXITCODE -ne 0) { throw "Kind cluster failed" }

    kubectl cluster-info --context kind-production-cluster
    kubectl get nodes

    Write-Host "Kind cluster ready" -ForegroundColor Green
} else {
    Write-Host "Skipping cluster creation" -ForegroundColor Yellow
    kubectl config use-context kind-production-cluster
}

# ==============================
# 4. LOAD IMAGES
# ==============================
Write-Step "Loading Images into Kind"

kind load docker-image production-backend:latest --name production-cluster
kind load docker-image production-frontend:latest --name production-cluster

Write-Host "Images loaded" -ForegroundColor Green

# ==============================
# 5. INGRESS CONTROLLER
# ==============================
Write-Step "Installing NGINX Ingress"

kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml

kubectl wait --namespace ingress-nginx `
    --for=condition=ready pod `
    --selector=app.kubernetes.io/component=controller `
    --timeout=120s

Write-Host "Ingress ready" -ForegroundColor Green

# ==============================
# 6. ARGOCD INSTALL
# ==============================
if (-not $SkipArgoCD) {
    Write-Step "Installing ArgoCD"

    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

    kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort"}}'

    $argoPassword = kubectl -n argocd get secret argocd-initial-admin-secret `
        -o jsonpath="{.data.password}" `
        | ForEach-Object { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }

    Write-Host "ArgoCD Ready!" -ForegroundColor Green
    Write-Host "URL: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "User: admin" -ForegroundColor Cyan
    Write-Host "Pass: $argoPassword" -ForegroundColor Yellow

    Start-Process powershell -ArgumentList "kubectl port-forward svc/argocd-server -n argocd 8080:80"
} else {
    Write-Host "Skipping ArgoCD" -ForegroundColor Yellow
}

# ==============================
# 7. DEPLOY APP
# ==============================
Write-Step "Deploying Application"

kubectl apply -k k8s/base

kubectl wait --for=condition=available --timeout=180s deployment/backend -n production-app
kubectl wait --for=condition=available --timeout=180s deployment/frontend -n production-app

# ==============================
# 8. VERIFY
# ==============================
Write-Step "Verification"

kubectl get pods -n production-app
kubectl get svc -n production-app
kubectl get ingress -n production-app
kubectl get hpa -n production-app

# ==============================
# 9. OUTPUT INFO
# ==============================
Write-Step "Access Info"

Write-Host "Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Health:   http://localhost:3001/health" -ForegroundColor Cyan

if (-not $SkipArgoCD) {
    Write-Host "ArgoCD: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "User: admin" -ForegroundColor Cyan
    Write-Host "Pass: $argoPassword" -ForegroundColor Yellow
}

Write-Host "`nDONE ✅ Cluster is ready" -ForegroundColor Green
Write-Host "Run: kubectl get all -n production-app" -ForegroundColor Yellow