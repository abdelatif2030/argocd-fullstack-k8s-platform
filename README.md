\# 🚀 Production App - DevOps Full Stack Platform



A \*\*cloud‑native DevOps project\*\* demonstrating CI/CD, Kubernetes orchestration, GitOps with ArgoCD, and containerised microservices deployment – all running locally on Kind.



\[!\[Kind](https://img.shields.io/badge/Kind-v1.32.2-blue)](https://kind.sigs.k8s.io/)

\[!\[ArgoCD](https://img.shields.io/badge/ArgoCD-v2.14-orange)](https://argo-cd.readthedocs.io/)

\[!\[NGINX](https://img.shields.io/badge/Ingress-NGINX-green)](https://kubernetes.github.io/ingress-nginx/)



\---



\## 📌 Overview



This project simulates a \*\*real production environment\*\* using:



\- \*\*Kubernetes\*\* (Kind cluster with 1 control‑plane + 2 workers)

\- \*\*Docker\*\* containerisation

\- \*\*Frontend + Backend\*\* microservices (Node.js / Express + React / static UI)

\- \*\*PostgreSQL\*\* database with persistent storage

\- \*\*NGINX Ingress Controller\*\* for routing

\- \*\*Horizontal Pod Autoscaling (HPA)\*\* based on CPU

\- \*\*ArgoCD\*\* for GitOps deployment



All components are deployed in a dedicated `production-app` namespace, with rolling updates and zero‑downtime capabilities.



\---



\## 🏗️ Architecture



User

│

▼

http://localhost:3002 ──► Frontend Service (NodePort)

│

▼

NGINX Ingress (path: /api/\*)

│

▼

Backend Service (ClusterIP)

│

▼

PostgreSQL (StatefulSet + PVC)





Internal traffic:

\- Frontend (React) → Backend API via Ingress `/api`

\- Backend → PostgreSQL (ClusterIP)



\---



\## ⚙️ Tech Stack



| Component       | Technology                          |

|----------------|-------------------------------------|

| Containerisation | Docker, Docker Compose             |

| Orchestration   | Kubernetes (Kind)                   |

| Ingress         | NGINX Ingress Controller            |

| GitOps          | ArgoCD                              |

| Backend API     | Node.js / Express                   |

| Frontend        | React (static build with Nginx)     |

| Database        | PostgreSQL 15                       |

| Autoscaling     | Horizontal Pod Autoscaler (HPA)     |

| Storage         | PersistentVolumeClaim (PVC)         |



\---



\## 📂 Project Structure



\---



\## 🚀 How to Run (Quick Start)



> \*\*Prerequisites:\*\* Docker, `kubectl`, `kind`, `curl`, and a Unix‑like shell (PowerShell 7+ on Windows works with `setup.ps1`).



\### 1️⃣ Clone the Repository



```bash

git clone https://github.com/your-username/production-app.git

cd production-app



2️⃣ Run the Automated Setup Script (Recommended)

On Windows (PowerShell):



.\\scripts\\setup.ps1



3️⃣ Manual Steps (Alternative)



cd frontend

docker build -t production-frontend:latest .

cd ../backend

docker build -t production-backend:latest .



Create Kind Cluster



kind create cluster --name production-cluster --config kind-config.yaml



Load Images



kind load docker-image production-frontend:latest --name production-cluster

kind load docker-image production-backend:latest --name production-cluster



Install NGINX Ingress



kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s



Install ArgoCD



kubectl create namespace argocd

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl wait --namespace argocd --for=condition=ready pod --selector=app.kubernetes.io/name=argocd-server --timeout=120s



Deploy Application Manifests



kubectl apply -k k8s/   # using kustomization.yaml

\# or

kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml -f k8s/secret.yaml -f k8s/backend-deployment.yaml ...





Wait for Pods \& Ingress



kubectl wait --namespace production-app --for=condition=ready pod --all --timeout=120s



🌐 Access URLs



After successful deployment, you can reach the services at:



Service	URL	Notes

Frontend	http://localhost:3002	Exposed via NodePort (30002)

Backend API	http://localhost:3001	Accessible through port‑forward or Ingress

Backend Health	http://localhost:3001/health	Returns {"status":"ok"}

ArgoCD UI	http://localhost:8080	Login with admin / (see password below)

The Ingress is configured on localhost – it routes /api/\* to the backend service.



📊 Features

✅ CI/CD ready – manifests fit any pipeline (GitHub Actions, GitLab CI)



✅ Multi‑service Kubernetes with isolated namespace



✅ Horizontal Pod Autoscaling (HPA) – scales backend/frontend from 2 to 5 replicas based on CPU > 70%



✅ Ingress routing – single entry point with path‑based routing



✅ GitOps with ArgoCD – automatic sync from Git repository



✅ Production‑like architecture – rolling updates, liveness/readiness probes, resource limits



✅ Persistent storage for PostgreSQL using StatefulSet + PVC



🔄 Deployment Strategy

Rolling updates – maxSurge: 25%, maxUnavailable: 0 (zero downtime)



Health checks – liveness \& readiness probes on /health (backend) and / (frontend)



Autoscaling – HPA based on CPU utilisation (target 70%)



GitOps – ArgoCD watches the Git repo and applies changes automatically



📈 Monitoring \& Debugging

Verify Deployments

bash

kubectl get all -n production-app

kubectl get hpa -n production-app

kubectl get ingress -n production-app

View Logs

bash

kubectl logs -f deployment/backend -n production-app

kubectl logs -f deployment/frontend -n production-app

kubectl logs -f statefulset/postgres -n production-app

Port‑forward for Direct Access

bash

\# Backend API on localhost:3001

kubectl port-forward -n production-app svc/backend 3001:3000



\# PostgreSQL (psql)

kubectl port-forward -n production-app svc/postgres 5432:5432

Check HPA Status

bash

kubectl describe hpa backend-hpa -n production-app

kubectl describe hpa frontend-hpa -n production-app

🔐 ArgoCD Setup

ArgoCD is installed in the argocd namespace.



Retrieve Admin Password

bash

\# Wait for the secret to be created (may take 30 seconds)

kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

Access ArgoCD UI

Port‑forward the ArgoCD server:



bash

kubectl port-forward -n argocd svc/argocd-server 8080:443

Open http://localhost:8080



Login with username admin and the password retrieved above.



Sync the Application (if not automatic)

In the UI, locate the production-app application and click SYNC.

The application is defined in app.yaml or argocd/app.yaml.



🧪 Troubleshooting

Issue	Solution

Pending pods	Check resources: kubectl describe pod <pod> -n production-app

Ingress not working	Verify controller is running: kubectl get pods -n ingress-nginx

ArgoCD CRD annotation error (too long)	Ignore – harmless warning; ArgoCD still works.

argocd-initial-admin-secret not found	Wait 30–60 seconds after ArgoCD installation and rerun the kubectl get secret command.

HPA shows <unknown>/70%	Metrics server not installed. Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Kind cluster nodes NotReady	Give it a few seconds; if persists, restart Docker and recreate cluster.

Port 3001 or 3002 already in use	Change NodePort in k8s/services.yaml or stop the conflicting process.

🧹 Cleanup

Delete the entire Kind cluster (removes all resources):



bash

kind delete cluster --name production-cluster

To remove only the application namespace (keep cluster):



bash

kubectl delete namespace production-app

📈 Future Improvements

CI/CD pipeline – GitHub Actions to build, test, and push images to a registry (Docker Hub / ACR)



Monitoring stack – Prometheus + Grafana (metrics and dashboards)



Logging – EFK (Elasticsearch, Fluentd, Kibana) or Loki



Helm charts – package the whole application for easier reuse



Argo Rollouts – Blue/Green or Canary deployments



Cloud deployment – AWS EKS with managed node groups



Security – OPA/Gatekeeper policies, secret encryption with KMS



Service Mesh – Istio or Linkerd for advanced traffic control

# Quick status check
kubectl get nodes; kubectl get pods -n production-app; kubectl get applications -n argocd

👨‍💻 Author

DevOps Full Stack Project
DEVOPS engineer Abdelatef Mohamed

Kubernetes • CI/CD • GitOps • Cloud Infrastructure


























