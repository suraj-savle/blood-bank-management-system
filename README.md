# Blood Bank Management System (BBMS)

## Overview

The **Blood Bank Management System (BBMS)** is a web-based platform designed to streamline the management of blood donations, hospital requests, and inventory tracking. By replacing manual processes with a structured digital workflow, BBMS enables hospitals and blood banks to access real-time inventory, maintain donor records, and process blood requests efficiently.


## The Problem

Many blood banks still rely on manual documentation, scattered information, and slow communication methods. This leads to:

* No real-time visibility of blood availability
* Delays during emergency blood requirements
* Frequent data entry errors
* Difficulty managing donors, patients, and hospital requests
* Lack of a centralized system connecting all operations

These limitations reduce the efficiency and reliability of blood bank operations.


## Our Solution

BBMS provides an **all-in-one, centralized, and secure system** that handles all operations digitally. Key features include:

* Donor registration and management
* Hospital request creation and status tracking
* Real-time inventory monitoring
* Secure authentication using JWT
* Fully structured backend APIs
* Organized frontend interface for hospitals and staff

The goal is to ensure quick response times, reduce manual errors, and improve operational workflow.

## Tech Stack

### Frontend

* React.js
* React Router
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt for password hashing

## Environment Setup

### Clone the Repository

```bash
git clone https://github.com/suraj-savle/blood-bank-management-system.git
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```bash
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Important: Seed Admin Account (First Time Setup)

Before starting the backend server for the first time, you must create an admin user.

### Open the file: backend/seedAdmin.js
Update the admin credentials inside the file:

### Run the seed script from the backend folder:

```bash
node seedAdmin.js
```

This will create the admin account in the database.

### Start the backend server:

```bash
npm start
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

### 🐳 Another Option: Run with Docker (Recommended)

Make sure Docker Desktop is installed and running.

```bash
docker compose up --build
```

Access the app:

Frontend → http://localhost

Backend → http://localhost:3000

Seed Admin User (if needed)

```bash
docker exec -it backend node seedAdmin.js
```

**Login Page**

<img width="1920" height="970" alt="image" src="https://github.com/user-attachments/assets/b7796043-c68d-4dda-8203-0be6b79ee5c0" />


**Admin Dashboard**

<img width="1920" height="1257" alt="image" src="https://github.com/user-attachments/assets/08f36872-ee09-4716-a66a-316aa1c763d5" />

**Donor ashboard**

<img width="1732" height="1536" alt="image" src="https://github.com/user-attachments/assets/9d715e70-c930-4f00-b8f4-0e28d43ee07e" />

**Manage Requests**

<img width="1920" height="1518" alt="image" src="https://github.com/user-attachments/assets/7aafa2aa-d2d4-4f20-982b-136de08df71a" />


**Inventory Overview**

<img width="1920" height="1121" alt="image" src="https://github.com/user-attachments/assets/65110412-2e41-4c0f-824d-7ee9ebed91bb" />
