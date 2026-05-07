# ⎈ Production App — Cloud-Native DevOps Platform

A production-grade DevOps project demonstrating Kubernetes orchestration, GitOps with ArgoCD, containerised microservices, autoscaling, and a real-time K8s dashboard — all running locally on Kind.

![Kind](https://img.shields.io/badge/Kind-v1.32.2-6366f1?style=flat-square)
![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.32-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-v2.14-EF7B4D?style=flat-square&logo=argo&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-Ingress-009639?style=flat-square&logo=nginx&logoColor=white)

---

## Overview

This project simulates a real production Kubernetes environment locally. It includes a full microservices stack, GitOps continuous delivery, horizontal autoscaling, and a custom-built K8s monitoring dashboard with authentication — all automated through a single PowerShell setup script.

**Highlights:**
- One-command setup via `setup.ps1` — cluster, images, ingress, ArgoCD, app, port-forwards
- K8s dashboard with login, pod health monitoring, and namespace filtering
- ArgoCD GitOps — auto-syncs from GitHub on every push
- HPA autoscaling from 2 to 5 replicas based on CPU utilisation
- Metrics Server for real CPU/memory data
- Multi-stage Docker builds with non-root security hardening
- Rolling deployments with zero downtime

---

## Architecture

```
Browser
  │
  ├── http://localhost:3002 ──► Frontend (React + Nginx) ──► NodePort Service
  │                                      │
  │                              NGINX Ingress /api/*
  │                                      │
  └── http://localhost:3001 ──► Backend (Node.js/Express) ──► ClusterIP Service
                                         │
                                    PostgreSQL 15
                                  (StatefulSet + PVC)

GitOps Flow:
  Git Push ──► ArgoCD detects change ──► Syncs k8s/base ──► Kubernetes applies manifests
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | Kubernetes 1.32 (Kind — 1 control-plane + 2 workers) |
| GitOps | ArgoCD v2.14 with AppProject + Application |
| Ingress | NGINX Ingress Controller |
| Frontend | React 18, Axios, multi-stage Docker + Nginx |
| Backend | Node.js 20, Express, REST API |
| Database | PostgreSQL 15 (StatefulSet + PersistentVolumeClaim) |
| Autoscaling | Horizontal Pod Autoscaler (CPU target 70%) |
| Metrics | Kubernetes Metrics Server |
| Dashboard | Custom React K8s dashboard with login + pod monitoring |
| IaC | Kustomize (k8s/base) |

---

## Project Structure

```
production-app/
├── frontend/                  # React dashboard (Login + K8s Dashboard + Users)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js       # Auth page
│   │   │   ├── Layout.js      # Sidebar navigation
│   │   │   ├── Dashboard.js   # Pod health monitoring
│   │   │   └── Users.js       # User CRUD
│   │   ├── App.js
│   │   └── App.css            # Dark theme design system
│   ├── nginx.conf
│   └── Dockerfile             # Multi-stage build
├── backend/                   # Node.js Express API
│   ├── src/
│   └── Dockerfile
├── database/                  # PostgreSQL init scripts
├── k8s/
│   └── base/                  # Kustomize manifests
│       ├── kustomization.yaml
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       ├── backend.yaml
│       ├── frontend.yaml
│       ├── postgres.yaml
│       ├── ingress.yaml
│       └── metrics-server.yaml
├── argocd/
│   └── projects/
│       ├── app-project.yaml   # ArgoCD AppProject
│       └── root-app.yaml      # ArgoCD Application
├── scripts/
│   └── setup.ps1              # Full automated setup script
├── kind-config.yaml           # Kind cluster config
├── argocd-ingress.yaml        # ArgoCD ingress
└── docker-compose.yml         # Local dev compose
```

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| kubectl | Latest | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| kind | Latest | [kind.sigs.k8s.io](https://kind.sigs.k8s.io/) |
| PowerShell | 7+ | [github.com/PowerShell](https://github.com/PowerShell/PowerShell) |

### One-Command Setup

```powershell
git clone https://github.com/abdelatif2030/production-app.git
cd production-app
.\scripts\setup.ps1
```

The script will:
1. Check all prerequisites
2. Build Docker images (with cache busting)
3. Create Kind cluster and wait for nodes to be Ready
4. Load images into all Kind nodes
5. Install NGINX Ingress Controller
6. Install Metrics Server (patched for Kind)
7. Install ArgoCD via server-side apply (fixes CRD size limit)
8. Patch ArgoCD service to NodePort
9. Apply AppProject and Application for GitOps
10. Deploy the application via Kustomize
11. Start port-forwards for all services

### Skip Flags

```powershell
# Skip rebuilding Docker images (use existing)
.\scripts\setup.ps1 -SkipDockerBuild

# Skip recreating the cluster (use existing)
.\scripts\setup.ps1 -SkipClusterCreate

# Skip ArgoCD installation
.\scripts\setup.ps1 -SkipArgoCD
```

---

## Access URLs

| Service | URL | Credentials |
|---|---|---|
| K8s Dashboard | http://localhost:3002 | admin / admin |
| Backend API | http://localhost:3001 | — |
| Backend Health | http://localhost:3001/health | — |
| ArgoCD UI | http://localhost:8080 | admin / (printed by script) |
| ArgoCD Ingress | http://argocd.localhost | admin / (printed by script) |

---

## Dashboard Features

The frontend is a custom-built K8s monitoring dashboard:

- **Login page** — authentication before accessing any dashboard data
- **Cluster overview** — total pods, running count, unhealthy count, namespace summary
- **Pod status table** — all pods with name, namespace, status badge, restart count, age
- **Namespace filter** — filter pods by `production-app` or `argocd`
- **Live backend health** — polls `/health` every 5 seconds, shown as a status banner
- **Users page** — full CRUD for application users backed by PostgreSQL
- **Dark theme** — Space Grotesk + JetBrains Mono, purple/teal accent palette

---

## GitOps with ArgoCD

ArgoCD watches the `k8s/base` directory in this repository and automatically applies any changes on push.

**Application config** (`argocd/projects/root-app.yaml`):
- Repo: `https://github.com/abdelatif2030/production-app.git`
- Path: `k8s/base`
- Sync: automated with self-heal and prune
- Retry: 5 attempts with exponential backoff

**To trigger a GitOps deploy:**
```bash
# Make a change to any manifest in k8s/base/
git add .
git commit -m "feat: update resource limits"
git push origin main
# ArgoCD detects the change and syncs automatically
```

**Check sync status:**
```powershell
kubectl get application -n argocd
```

---

## Monitoring & Debugging

### Cluster status
```powershell
kubectl get all -n production-app
kubectl get hpa -n production-app
kubectl get ingress -n production-app
kubectl top nodes
kubectl top pods -n production-app
```

### Logs
```powershell
kubectl logs -f deployment/backend -n production-app
kubectl logs -f deployment/frontend -n production-app
kubectl logs -f statefulset/postgres -n production-app
```

### ArgoCD
```powershell
kubectl get application -n argocd
kubectl get appproject -n argocd
kubectl logs -f deployment/argocd-server -n argocd
```

### HPA
```powershell
kubectl describe hpa backend-hpa -n production-app
kubectl describe hpa frontend-hpa -n production-app
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Nodes show `NotReady` | Script waits automatically — give it 30s |
| HPA shows `<unknown>/70%` | Metrics Server not ready yet — wait 60s after install |
| ArgoCD CRD annotation too long | Fixed — script uses `--server-side --force-conflicts` |
| `argocd-initial-admin-secret` not found | Wait 30–60s after ArgoCD install and rerun |
| Port 3001/3002 already in use | Stop conflicting process or change NodePort in `k8s/base/frontend.yaml` |
| Build uses cached layers | Script touches `.buildtime` to bust COPY cache automatically |
| ArgoCD patch fails | Script has automatic fallback to `kubectl replace` |

---

## Cleanup

```powershell
# Delete everything (cluster + all resources)
kind delete cluster --name production-cluster

# Delete only the app namespace (keep cluster + ArgoCD)
kubectl delete namespace production-app
```

---

## Roadmap

- [ ] GitHub Actions CI/CD — build, test, push images to Docker Hub on PR merge
- [ ] Prometheus + Grafana — metrics collection and dashboards
- [ ] Loki + Promtail — centralised log aggregation
- [ ] Helm charts — package app for reuse across environments
- [ ] Argo Rollouts — blue/green and canary deployment strategies
- [ ] AWS EKS — cloud deployment with managed node groups
- [ ] OPA/Gatekeeper — policy enforcement and secret encryption
- [ ] Istio service mesh — advanced traffic management and mTLS

---

## Author

**Abdelatef Mohamed** — DevOps Engineer

Kubernetes · CI/CD · GitOps · Cloud Infrastructure · React · Node.js

[![GitHub](https://img.shields.io/badge/GitHub-abdelatif2030-181717?style=flat-square&logo=github)](https://github.com/abdelatif2030)
