# Deployment of Blood bank management system on kubernetes

---

## Install the Kind in your local using below link

Link : https://kind.sigs.k8s.io/docs/user/quick-start/#installation

---
## Download Metrics Server using below command

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

#### Check whether Metrics Server is running using below command.

kubectl get pods -n kube-system | grep metrics-server

----
### Follow below steps to setup the application on kind cluster

#### Create cluster using below command

kind create cluster --name cluster name

#### Create namespace for bloodbank app by applying manifest file

kubectl apply -f namespace.yml

#### Create PersistenceVolume and PersistenceVolumeClaim for mongodb using below commands

cd database

kubectl apply -f pv.yml

kubectl apply -f pvc.yml

#### Apply below command to create mongodb statefulset.

kubectl apply -f mongodb.yml

#### Apply below command to create mongodb service.

kubectl apply -f mongoservice.yml

#### Create PersistenceVolume and PersistenceVolumeClaim for backend.

cd backend 

kubectl apply -f pv.yml

kubectl apply -f pvc.yml

#### Create secret backend , deployment and service using below commands ( Modify the image before applying backend.yml )
kubectl apply -f secret.yml

kubectl apply -f backend.yml

kubectl apply -f service.yml

#### (Optional step : If you want to test VPA follow below steps )Before applying VPA yaml follow below steps:

git clone https://github.com/kubernetes/autoscaler

cd autoscaler

cd vertical-pod-autoscaler

cd deploy

#### Apply all manifest files in deploy folder.
k apply -f .

#### Apply below command to create VPA .

kubectl apply -f vpa.yml (autoscaling when resource increase when reaching threshold)

#### Create frontend deployment ( Modify the image before applying backend.yml )

kubectl apply -f Frontend.yml
kubectl apply -f service.yml

#### (Optional step : If you want to test HPA apply below command )


kubectl apply -f hpa.yml


#### Create ingress using below command.

kubectl apply -f ingress.yml

#### We can checkmkubernetes resources using below commands.

##### To check pod status.

kubectl get pods 

kubectl get pods -o wide

##### To check service 

kubectl get svc

##### To check ingress

kubectl get ingress
 
----

#### You can test the application using port forwarding the frontend service.

kubectl port-forward svc/frontend 8080 : 80

Open localhost:8080 in your browser

----


<img width="1920" height="1008" alt="image" src="https://github.com/user-attachments/assets/3c31ec8e-1a6f-476b-97a9-9c61bb939c22" />

<img width="1920" height="1008" alt="image" src="https://github.com/user-attachments/assets/535f1c64-eb1d-4a39-baac-6e40e299e15b" />

<img width="1920" height="1008" alt="image" src="https://github.com/user-attachments/assets/ad127bff-689a-4b61-a9aa-49a571a5548c" />


<img width="1920" height="1008" alt="image" src="https://github.com/user-attachments/assets/9c4fd708-4e7f-4de8-94ba-40f445c3ea83" />


