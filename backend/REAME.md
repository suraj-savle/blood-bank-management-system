# Blood Bank Management System (BBMS) - Backend

## Overview

The **Blood Bank Management System (BBMS)** backend is a robust API designed to support the management of blood donations, hospital requests, and inventory tracking. It facilitates real-time access to data, ensuring efficient operations for blood banks and hospitals.

## The Problem

Many blood banks face challenges due to outdated methods, including:

- No real-time visibility of blood availability
- Delays in emergency blood requirements
- Frequent data entry errors
- Difficulty managing donor, patient, and hospital requests
- Lack of a centralized system for streamlined operations

## Our Solution

The backend of BBMS offers a **centralized and secure API** that addresses these issues by providing:

- **Donor registration and management**
- **Hospital request creation and tracking**
- **Real-time inventory monitoring**
- **Secure authentication** using JWT
- **Structured RESTful APIs** for seamless integration
- **API documentation** via Swagger for easy reference

The backend is designed to enhance operational efficiency, reduce manual errors, and ensure timely responses to blood requests.

## Technologies Used

- **Node.js** for server-side development
- **Express** for building RESTful APIs
- **MongoDB** for data storage and management
- **JWT** for secure user authentication
- **Swagger** for API documentation and testing

## Getting Started

### Prerequisites

Ensure you have the following installed locally:

- Node.js
- npm (Node Package Manager)
- MongoDB (or a cloud equivalent)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the backend directory:
   ```bash
   cd blood-bank-management-system/backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure environment variables in a `.env` file (use `.env.example` as a reference).

5. Start the server:
   ```bash
   npm start
   ```

### API Documentation

Access the Swagger UI for API documentation at:

- `http://localhost:5000/api/doc`

This interface provides a detailed view of available endpoints and their usage.
