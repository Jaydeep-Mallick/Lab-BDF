# BDF Lab 2: SQLite Database and CRUD Routes (Book API)

This repository contains the complete implementation of **BDF Lab 2: SQLite Database and CRUD Routes** built with **Node.js**, **Express.js**, and **SQLite (`sqlite`, `sqlite3`)**, configured and deployed on **Render Web Services**.

The service manages a book catalog stored in an SQLite database (`books.db`) and exposes five RESTful CRUD endpoints with parameterized SQL queries, clean HTTP status codes (`200`, `201`, `400`, `404`, `500`), idempotent database initialization, and cloud deployment compatibility.

---

## Live Deployment

- **Live Application:** [https://lab2bdf.onrender.com](https://lab2bdf.onrender.com)
- **Get All Books API:** [https://lab2bdf.onrender.com/books/](https://lab2bdf.onrender.com/books/)

The application is deployed on Render and provides REST API endpoints for managing book records.

---

## Table of Contents
1. [Live Deployment](#live-deployment)
2. [Project Overview](#project-overview)
3. [Database Schema](#database-schema)
4. [Repository Structure](#repository-structure)
5. [Prerequisites & Installation](#prerequisites--installation)
6. [Database Initialization](#database-initialization)
7. [Running Locally](#running-locally)
8. [API Documentation](#api-documentation)
9. [Screenshots](#screenshots)
10. [Render Deployment Configuration](#render-deployment-configuration)
11. [SQLite Persistence Considerations](#sqlite-persistence-considerations)
12. [Viva & Technical Concepts](#viva--technical-concepts)
13. [Conclusion](#conclusion)

---

## Project Overview

- **Runtime Environment:** Node.js (v20 LTS recommended)
- **Framework:** Express.js 5
- **Database Engine:** SQLite3 with `sqlite` (Promise-based async/await wrapper)
- **Database File:** `books.db` (configurable via `DB_PATH`)
- **Port:** Configured dynamically via `process.env.PORT || 3000`
- **Development Tool:** Nodemon (for live hot-reloading)
- **Cloud Platform:** Render Web Services

---

## Database Schema

Table Name: `book`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique auto-incremented identifier for each book |
| `title` | TEXT | NOT NULL | Title of the book |
| `author` | TEXT | NOT NULL | Full name of the author |
| `price` | INTEGER | NOT NULL | Price in currency units |
| `pages` | INTEGER | NOT NULL | Total page count |

---

## Repository Structure

```text
.
├── .gitignore          # Ignores node_modules, .env, OS files, and logs
├── .node-version       # Pins Node.js version to 20 LTS for cloud hosts
├── .nvmrc              # Node version manager configuration
├── README.md           # Comprehensive project documentation
├── app.js              # Express application, routes, and DB initialization
├── books.db            # SQLite database file containing 10 initial records
├── npm.js              # Fallback entry point for cloud runners
├── package.json        # Dependencies, engines, and run scripts
├── package-lock.json   # Deterministic dependency lockfile
├── render.yaml         # Render Blueprint configuration
├── screenshots/        # Postman test execution screenshots
│   ├── Image 27-10-26 at 10.11 AM (1).png
│   ├── Image 27-10-26 at 10.12 AM.png
│   ├── Image 27-10-26 at 10.15 AM.png
│   ├── Image 27-10-26 at 10.16 AM.png
│   ├── Image 27-10-26 at 10.23 AM.png
│   └── Image 27-10-26 at 10.25 AM.png
└── setup.sql           # SQL script for manual database schema & sample seed
```

---

## Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **npm**: v9.0.0 or higher
- **Postman / cURL**: For endpoint testing

### Installation
1. Clone or open the repository folder in your terminal:
   ```bash
   cd /path/to/Lab2bdf
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```

---

## Database Initialization

The application supports two initialization methods:

1. **Automatic Idempotent Seeding (Recommended & Render-Ready):**
   When the server boots via `app.js`, it automatically creates the `book` table if it does not already exist. It then checks the record count; **only if the table is empty**, it seeds 10 sample books. Existing records are preserved and no duplicate records are inserted upon server restarts.

2. **Manual Seeding via SQLite CLI:**
   You can also seed or reset the database using `setup.sql`:
   ```bash
   sqlite3 books.db < setup.sql
   ```

---

## Running Locally

### Development Mode (with Nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Upon successful startup, the server logs:
```text
Server Running at http://localhost:3000/
```

---

## API Documentation

### Endpoints Summary Table

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/books/` | Retrieve all books |
| `GET` | `/books/:bookId/` | Retrieve a book by ID |
| `POST` | `/books/` | Add a new book |
| `PUT` | `/books/:bookId/` | Update an existing book |
| `DELETE` | `/books/:bookId/` | Delete a book |

---

### Detailed Endpoint Specifications

#### 1. GET `/books/`
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/` (or `https://lab2bdf.onrender.com/books/`)
- **Status:** `200 OK`
- **Sample Response:**
  ```json
  [
    {
      "id": 1,
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "price": 450,
      "pages": 281
    },
    {
      "id": 2,
      "title": "1984",
      "author": "George Orwell",
      "price": 399,
      "pages": 328
    }
  ]
  ```

---

#### 2. GET `/books/:bookId/`
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/1/`
- **Status:** `200 OK`
- **Sample Response:**
  ```json
  {
    "id": 1,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "price": 450,
    "pages": 281
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"error": "Invalid book ID format. It must be a number."}`
  - `404 Not Found`: `{"error": "Book not found"}`

---

#### 3. POST `/books/`
- **Method:** `POST`
- **URL:** `http://localhost:3000/books/`
- **Headers:** `Content-Type: application/json`
- **Request Body Example:**
  ```json
  {
    "title": "The 48 Laws of Power",
    "author": "Robert Greene",
    "price": 550,
    "pages": 480
  }
  ```
- **Status:** `201 Created`
- **Sample Response:**
  ```json
  {
    "message": "Book Added Successfully",
    "bookId": 12
  }
  ```
- **Error Response:**
  - `400 Bad Request`: `{"error": "Missing required fields: title, author, price, and pages are required."}`

---

#### 4. PUT `/books/:bookId/`
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1/`
- **Headers:** `Content-Type: application/json`
- **Request Body Example:**
  ```json
  {
    "title": "To Kill a Mockingbird - Updated",
    "author": "Harper Lee",
    "price": 500,
    "pages": 281
  }
  ```
- **Status:** `200 OK`
- **Sample Response:**
  ```json
  {
    "message": "Book Details Updated Successfully"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: When fields are missing or ID is invalid.
  - `404 Not Found`: When `bookId` does not exist in the database.

---

#### 5. DELETE `/books/:bookId/`
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/12`
- **Status:** `200 OK`
- **Sample Response:**
  ```json
  {
    "message": "Book Deleted Successfully"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: If `bookId` is not a valid number.
  - `404 Not Found`: If `bookId` is not found.

---

## Screenshots

The following screenshots capture the execution of all CRUD operations tested via **Postman**:

### 1. GET All Books (`GET /books/`)
Retrieving the complete list of books from the database with HTTP `200 OK`.

![GET All Books](<screenshots/Image 27-10-26 at 10.11 AM (1).png>)

---

### 2. GET Book by ID (`GET /books/1/`)
Retrieving single book details for ID `1` ("To Kill a Mockingbird") with HTTP `200 OK`.

![GET Book by ID](<screenshots/Image 27-10-26 at 10.12 AM.png>)

---

### 3. POST Add New Book (`POST /books/`)
Inserting a new book ("The 48 Laws of Power") via JSON request body, returning HTTP `201 Created` with new `bookId: 12`.

![POST Add Book](<screenshots/Image 27-10-26 at 10.15 AM.png>)

---

### 4. PUT Update Existing Book (`PUT /books/1/`)
Updating book ID `1` details ("To Kill a Mockingbird - Updated"), returning HTTP `200 OK` with confirmation message.

![PUT Update Book](<screenshots/Image 27-10-26 at 10.16 AM.png>)

---

### 5. DELETE Book by ID (`DELETE /books/12`)
Deleting book ID `12`, returning HTTP `200 OK` with `"Book Deleted Successfully"`.

![DELETE Book](<screenshots/Image 27-10-26 at 10.23 AM.png>)

---

### 6. GET All Books Verification Post-Deletion (`GET /books`)
Verifying the updated book catalog after deleting book `12` with HTTP `200 OK` (list terminates at ID `10`).

![GET All Books Verification](<screenshots/Image 27-10-26 at 10.25 AM.png>)

---

## Render Deployment Configuration

The application is deployed on **Render** as a Web Service.

### Deployment Settings
- **Repository:** `Jaydeep-Mallick/Lab2bdf`
- **Language / Runtime:** `Node`
- **Branch:** `main`
- **Root Directory:** *(leave blank — `package.json` is at repository root)*
- **Build Command:**
  ```bash
  npm install && npm rebuild sqlite3 --build-from-source
  ```
- **Start Command:**
  ```bash
  node app.js
  ```
- **Environment Variables:**
  - `NODE_VERSION`: `20.18.0`

### Blueprint Configuration (`render.yaml`)
A ready-to-use Render Blueprint is provided in [render.yaml](render.yaml):
```yaml
services:
  - type: web
    name: lab2bdf
    runtime: node
    plan: free
    buildCommand: npm install && npm rebuild sqlite3 --build-from-source
    startCommand: node app.js
    envVars:
      - key: NODE_VERSION
        value: 20.18.0
```

---

## SQLite Persistence Considerations

Render's free tier uses an **ephemeral disk**:
- Files created or modified during container runtime reset whenever the instance goes to sleep or redeploys.
- **Idempotent Self-Healing:** Because `initializeDBAndServer()` in `app.js` automatically creates the table and seeds the 10 initial records if the database is fresh, the application remains fully operational across cold starts without manual intervention.
- **Persistent Disk (Optional):** For permanent multi-session persistence on paid tiers, attach a Render Disk at `/var/data` and configure the environment variable `DB_PATH=/var/data/books.db`.

---

## Viva & Technical Concepts

1. **Why `initializeDBAndServer()`?**
   Database connections in SQLite are asynchronous. Registering routes first and awaiting the database open call before invoking `app.listen()` guarantees that incoming client requests never encounter an uninitialized database state.
2. **Why Parameterized Queries (`?` Placeholders)?**
   Directly interpolating user input into SQL strings introduces SQL Injection vulnerabilities. Parameter placeholders bind values as literal data, preventing malicious code execution.
3. **Database Methods:**
   - `db.all()`: Fetches an array of multiple records (used in `GET /books/`).
   - `db.get()`: Fetches a single record object (used in `GET /books/:bookId/`).
   - `db.run()`: Executes data-modifying queries (`INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`) and returns `lastID` and `changes`.
4. **HTTP Status Codes:**
   - `200 OK`: Successful read, update, or delete.
   - `201 Created`: Successful creation of a new book resource.
   - `400 Bad Request`: Client sent invalid ID format or missing required payload fields.
   - `404 Not Found`: Target `bookId` does not exist in the database.
   - `500 Internal Server Error`: Unhandled database or server exception.

---

## Conclusion

This project demonstrates a production-grade RESTful Book API using Node.js, Express, and SQLite with complete CRUD operations, parameterized SQL queries, clean HTTP status codes, Postman validation, and cloud hosting on Render.
