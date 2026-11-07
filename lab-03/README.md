# Lab 3: REST API, Query Parameters, Validation, Debugging

**Name:** Jaydeep Mallick · **Registration number:** 252U1R9047 · **Section:** GenAI 2A  
**Course:** Backend Development Fundamentals (BDF) · Year II Term II · Aurora  
**Faculty:** Joel Prashanth D  

---

## Live Link

- **Live Application URL:** [https://lab-bdf-3.onrender.com](https://lab-bdf-3.onrender.com)
- **Books REST API Endpoint:** [https://lab-bdf-3.onrender.com/books](https://lab-bdf-3.onrender.com/books)

---

## Project Overview

This laboratory assignment is an extension of **BDF Lab 02**, evolving the basic SQLite book management system into a robust, secure, and production-grade **REST API**.

Key enhancements implemented in Lab 03:
1. **RESTful Naming Conventions:** Strict noun-based resource routes (`/books`, `/books/:bookId`) mapped to standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
2. **Query Parameters:** Support for partial title search (`search_q` with SQL `LIKE`), sorting column (`order_by`), sorting order (`order` ASC/DESC), and pagination (`limit`, `offset`) with safe fallback defaults.
3. **Price-Range Filtering:** Filtering books using `min_price` and `max_price` (using SQL `BETWEEN` or combined range conditions).
4. **Input Validation:** Strict validation of `POST` and `PUT` request bodies, rejecting missing titles, missing authors, or non-numeric prices with explicit `HTTP 400 Bad Request` responses.
5. **Standardized HTTP Status Codes:** Returning `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, and `500 Internal Server Error` with consistent JSON message payloads (`{ "message": "..." }`).
6. **Debugging Common Backend Errors:** Systematic analysis and resolution of four major backend issues: `EADDRINUSE` port conflict, `MODULE_NOT_FOUND` wrong import paths, SQLite table-name typos, and missing `await` on asynchronous database operations.

---

## Technologies Used

- **Runtime:** [Node.js](https://nodejs.org/) (v20+ / v24 LTS)
- **Framework:** [Express.js](https://expressjs.com/) (v5.3.0)
- **Database Engine:** [SQLite3](https://www.sqlite.org/) (`sqlite3` driver v6.0.1)
- **Database Driver Wrapper:** [`sqlite`](https://www.npmjs.com/package/sqlite) (v5.1.1 - Promise-based async/await API)
- **Testing & Tooling:** [Postman](https://www.postman.com/) (Collection v2.1), Nodemon, curl, Git

---

## Repository Structure

```text
lab-03/
├── .env.example              # Sample environment configuration template
├── .gitignore                # Git ignore rules (node_modules, books.db, .env)
├── .node-version             # Specified Node.js version
├── .nvmrc                    # NVM version configuration
├── README.md                 # Complete documentation & lab report
├── app.js                    # Express application, REST routes, validation & DB init
├── books.db                  # Local SQLite database (git-ignored)
├── package.json              # Project metadata, scripts, and dependencies
├── package-lock.json         # Dependency tree lockfile
├── postman_collection.json   # Exported Postman collection (18 test cases)
├── render.yaml               # Cloud deployment descriptor for Render
├── setup.sql                 # SQL schema creation & initial 10 book records
├── test_runner.js            # Automated Node.js integration verification suite
├── debugging/                # Dedicated debugging documentation & runnable demos
│   ├── README.md             # Summary of all 4 debugging scenarios
│   ├── 1_eaddrinuse.md       # Scenario A: EADDRINUSE explanation & fix
│   ├── 1_eaddrinuse_demo.js  # Scenario A: Runnable conflict & fallback demo
│   ├── 2_wrong_import.md     # Scenario B: MODULE_NOT_FOUND explanation & fix
│   ├── 2_wrong_import_demo.js# Scenario B: Runnable import resolution demo
│   ├── 3_table_typo.md       # Scenario C: Table typo explanation & fix
│   ├── 3_table_typo_demo.js  # Scenario C: Runnable schema mismatch demo
│   ├── 4_missing_await.md    # Scenario D: Missing await explanation & fix
│   └── 4_missing_await_demo.js# Scenario D: Runnable Promise serialization demo
└── screenshots/              # Screenshot placeholders for submission
    ├── 01_get_all_books.png
    ├── 02_get_book_by_id.png
    ├── 03_get_search_q.png
    ├── 04_get_order_by_desc.png
    ├── 05_get_price_range.png
    ├── 06_get_combined_query.png
    ├── 07_post_success.png
    ├── 08_post_validation_error.png
    ├── 09_put_success.png
    ├── 10_put_404.png
    ├── 11_delete_success.png
    ├── 12_delete_404.png
    ├── 13_database_view.png
    └── README.md
```

---

## Installation and Execution

### 1. Prerequisites
Ensure [Node.js](https://nodejs.org/) (version 20 or higher) and [npm](https://www.npmjs.com/) are installed on your machine.

### 2. Clone and Navigate
```bash
git clone <your-repository-url>
cd lab-03
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables
Create a local `.env` file (do not commit this to version control):
```bash
cp .env.example .env
```

Required environment variables:
| Variable | Description | Default Local Value |
| :--- | :--- | :--- |
| `PORT` | Network port for the HTTP server | `3000` |
| `DB_PATH` | Path to the SQLite database file | `./books.db` |
| `NODE_ENV` | Application environment | `development` |

### 5. Start the Application
- **Production mode:**
  ```bash
  npm start
  ```
- **Development mode (with auto-restart via nodemon):**
  ```bash
  npm run dev
  ```

Upon startup, the server automatically connects to SQLite, verifies the schema, seeds the 10 initial sample books if empty, and prints:
```text
Initial sample book records seeded successfully.
Server Running at http://localhost:3000/
```

### 6. Run Automated Test Verification
An automated test runner is included to verify all 18 cases:
```bash
node test_runner.js
```

---

## REST API Endpoints

The API adheres strictly to REST conventions, using noun-based URIs and standard HTTP methods:

| HTTP Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Retrieve book catalog with search, sort, filter, and pagination | `200 OK`, `500 Internal Error` |
| `GET` | `/books/:bookId` | Retrieve a single book record by ID | `200 OK`, `400 Bad Request`, `404 Not Found`, `500` |
| `POST` | `/books` | Create a new book record (requires title, author, price, pages) | `201 Created`, `400 Bad Request`, `500` |
| `PUT` | `/books/:bookId` | Update an existing book's details by ID | `200 OK`, `400 Bad Request`, `404 Not Found`, `500` |
| `DELETE` | `/books/:bookId` | Delete a book record by ID | `200 OK`, `400 Bad Request`, `404 Not Found`, `500` |

---

## Query Parameters (`GET /books`)

All query parameters are optional and have built-in default values. They can be used individually or combined.

| Parameter | Type | Default | Description | Example Usage |
| :--- | :--- | :--- | :--- | :--- |
| `search_q` | String | `""` | Case-insensitive partial title match using SQL `LIKE ?` | `/books?search_q=Gatsby` |
| `order_by` | String | `"id"` | Column used for sorting (`id`, `title`, `author`, `price`, `pages`) | `/books?order_by=price` |
| `order` | String | `"ASC"` | Sorting direction: `ASC` (ascending) or `DESC` (descending) | `/books?order_by=price&order=DESC` |
| `limit` | Integer | `10` | Maximum number of records returned (pagination) | `/books?limit=5` |
| `offset` | Integer | `0` | Number of records skipped before returning results (pagination) | `/books?limit=5&offset=5` |
| `min_price`| Number | `undefined` | Minimum price filter (`price >= ?`) | `/books?min_price=300` |
| `max_price`| Number | `undefined` | Maximum price filter (`price <= ?`) | `/books?max_price=450` |

### Security & Whitelisting Note:
- User values (`search_q`, `min_price`, `max_price`, `limit`, `offset`) are passed strictly via **parameterized SQL placeholders (`?`)** to prevent SQL injection.
- The `order_by` column is validated against a strict whitelist array (`ALLOWED_COLUMNS = ['id', 'title', 'author', 'price', 'pages']`). If an unapproved column is passed, it safely falls back to `'id'`.
- The `order` direction is checked and restricted to either `'ASC'` or `'DESC'`.

---

## Validation and HTTP Status Codes

### POST /books Validation Rules
When creating a book via `POST /books`, the JSON request body is validated sequentially:

1. **Missing or empty `title`:**
   - Response: `HTTP 400 Bad Request`
   - Body: `{ "message": "Title is required" }`
2. **Missing or empty `author`:**
   - Response: `HTTP 400 Bad Request`
   - Body: `{ "message": "Author is required" }`
3. **Missing or non-numeric `price`:**
   - Response: `HTTP 400 Bad Request`
   - Body: `{ "message": "Price must be a valid number" }`
4. **Missing or non-numeric `pages`:**
   - Response: `HTTP 400 Bad Request`
   - Body: `{ "message": "Pages is required and must be a number" }`

### Standard Response Status Codes

| Status Code | Reason / Meaning | Example Response |
| :--- | :--- | :--- |
| **`200 OK`** | Successful retrieval, update, or deletion | `{ "message": "Book Details Updated Successfully" }` |
| **`201 Created`** | New resource successfully created in database | `{ "message": "Book Added Successfully", "bookId": 11 }` |
| **`400 Bad Request`**| Invalid input, non-numeric ID parameter, or validation error | `{ "message": "Title is required" }` |
| **`404 Not Found`**  | Requested book ID does not exist in the database | `{ "message": "Book not found" }` |
| **`500 Internal Server Error`** | Uncaught database or internal runtime failure | `{ "message": "database disk image is malformed" }` |

---

## Postman Testing Guide (18 Test Cases)

Import `postman_collection.json` into Postman, or test each endpoint using the specifications below:

### 1. GET all books
- **Method:** `GET`
- **URL:** `http://localhost:3000/books`
- **Expected Status:** `200 OK`
- **Expected Output:** Array of 10 book objects sorted by `id ASC`.

### 2. GET a book using its ID
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/1`
- **Expected Status:** `200 OK`
- **Expected Output:**
  ```json
  {
    "id": 1,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "price": 450,
    "pages": 281
  }
  ```

### 3. GET with search_q
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?search_q=Great`
- **Expected Status:** `200 OK`
- **Expected Output:** Array containing "The Great Gatsby" (matches partial title).

### 4. GET with order_by
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price`
- **Expected Status:** `200 OK`
- **Expected Output:** Books ordered from lowest price to highest price (default `ASC`).

### 5. GET with ASC
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=ASC`
- **Expected Status:** `200 OK`
- **Expected Output:** Lowest price book first (`Animal Farm` at 250).

### 6. GET with DESC
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=DESC`
- **Expected Status:** `200 OK`
- **Expected Output:** Highest price book first (`The Hobbit` at 499).

### 7. GET with limit
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?limit=3`
- **Expected Status:** `200 OK`
- **Expected Output:** Array containing exactly 3 books.

### 8. GET with offset
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?limit=3&offset=3`
- **Expected Status:** `200 OK`
- **Expected Output:** Array of 3 books starting from ID 4 (skips first 3 books).

### 9. GET with min_price and max_price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?min_price=300&max_price=400`
- **Expected Status:** `200 OK`
- **Expected Output:** Array of books with price between 300 and 400 inclusive.

### 10. GET with multiple combined query parameters
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?search_q=o&min_price=300&max_price=450&order_by=price&order=DESC&limit=4&offset=0`
- **Expected Status:** `200 OK`
- **Expected Output:** Filtered results matching all conditions simultaneously.

### 11. POST with valid data
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": 650,
    "pages": 464
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Output:**
  ```json
  {
    "message": "Book Added Successfully",
    "bookId": 11
  }
  ```

### 12. POST without title
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "author": "Robert C. Martin",
    "price": 650,
    "pages": 464
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Output:**
  ```json
  {
    "message": "Title is required"
  }
  ```

### 13. POST without author
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Clean Code",
    "price": 650,
    "pages": 464
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Output:**
  ```json
  {
    "message": "Author is required"
  }
  ```

### 14. POST with non-numeric price
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": "free",
    "pages": 464
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Output:**
  ```json
  {
    "message": "Price must be a valid number"
  }
  ```

### 15. PUT an existing book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "To Kill a Mockingbird (Special Edition)",
    "author": "Harper Lee",
    "price": 480,
    "pages": 290
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Output:**
  ```json
  {
    "message": "Book Details Updated Successfully"
  }
  ```

### 16. PUT a nonexistent book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/9999`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Phantom Book",
    "author": "Nobody",
    "price": 200,
    "pages": 100
  }
  ```
- **Expected Status:** `404 Not Found`
- **Expected Output:**
  ```json
  {
    "message": "Book not found"
  }
  ```

### 17. DELETE an existing book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/10`
- **Expected Status:** `200 OK`
- **Expected Output:**
  ```json
  {
    "message": "Book Deleted Successfully"
  }
  ```

### 18. DELETE a nonexistent book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/9999`
- **Expected Status:** `404 Not Found`
- **Expected Output:**
  ```json
  {
    "message": "Book not found"
  }
  ```

---

## Debugging Exercises

As required by the official Lab 03 specification, four common debugging scenarios were investigated and resolved:

### Scenario A: Port Conflict (`EADDRINUSE`)
- **Error:** `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause:** Another active Node.js server or application is currently bound to port 3000.
- **Resolution:**
  1. Identify the blocking process ID: `lsof -i :3000`.
  2. Terminate the process: `kill -9 <PID>`.
  3. Alternatively, supply an alternative port via environment variable: `PORT=3001 node app.js`.
- **Demo Script:** `node debugging/1_eaddrinuse_demo.js`

### Scenario B: Wrong Import Path (`MODULE_NOT_FOUND`)
- **Error:** `Error: Cannot find module '../database/sqlite'`
- **Cause:** Incorrect relative directory path (e.g. using `../` instead of `./`), misspelled file names, or missing file extensions.
- **Resolution:**
  1. Verify the relative directory structure (`./` for current directory, `../` for parent).
  2. Use Node.js built-in `path.join(__dirname, 'filename')` for safe filesystem path resolution.
- **Demo Script:** `node debugging/2_wrong_import_demo.js`

### Scenario C: Table-Name Typo (`no such table`)
- **Error:** `SQLITE_ERROR: no such table: books`
- **Cause:** In SQL, table names must match schema declarations strictly. The table was created as `book` (singular) while the query referenced `books` (plural).
- **Resolution:**
  1. Inspect `setup.sql` or `CREATE TABLE` statements to confirm the exact identifier.
  2. Correct SQL queries from `SELECT * FROM books;` to `SELECT * FROM book;`.
- **Demo Script:** `node debugging/3_table_typo_demo.js`

### Scenario D: Missing `await` in Asynchronous Operations
- **Error:** Responses return empty objects `{}` or code executes out-of-order.
- **Cause:** Asynchronous methods in `sqlite` return Promises. Without `await`, the variable holds `Promise { <pending> }`. When serialized to JSON, pending Promises serialize as `{}`.
- **Resolution:**
  1. Mark the route handler as `async (req, res) => { ... }`.
  2. Place `await` in front of every database call: `const books = await db.all(...);`.
- **Demo Script:** `node debugging/4_missing_await_demo.js`

---

## Screenshots

Place your captured screenshots inside the `screenshots/` directory matching the filenames below:

### 1. GET All Books (Default Limit & Offset)
![GET All Books](screenshots/01_get_all_books.png)

### 2. GET Book by ID (200 OK)
![GET Book by ID](screenshots/02_get_book_by_id.png)

### 3. GET with search_q Partial Match
![GET with search_q](screenshots/03_get_search_q.png)

### 4. GET with Sorting (order_by=price&order=DESC)
![GET with Sorting](screenshots/04_get_order_by_desc.png)

### 5. GET with Price Range Filtering (min_price & max_price)
![GET Price Range Filter](screenshots/05_get_price_range.png)

### 6. GET with Combined Query Parameters
![GET Combined Queries](screenshots/06_get_combined_query.png)

### 7. POST Create Book (201 Created)
![POST Valid Book](screenshots/07_post_success.png)

### 8. POST Validation Failure (400 Bad Request)
![POST Validation Error](screenshots/08_post_validation_error.png)

### 9. PUT Update Book (200 OK)
![PUT Success](screenshots/09_put_success.png)

### 10. PUT Nonexistent Book (404 Not Found)
![PUT 404](screenshots/10_put_404.png)

### 11. DELETE Existing Book (200 OK)
![DELETE Success](screenshots/11_delete_success.png)

### 12. DELETE Nonexistent Book (404 Not Found)
![DELETE 404](screenshots/12_delete_404.png)

### 13. SQLite Database View
![Database View](screenshots/13_database_view.png)

---

## Notes: Problems Faced and Solutions

1. **Combining Dynamic Query Filters with Safe SQL:**
   - *Problem:* When building a query supporting search, price ranges, sorting, and pagination, concatenating strings directly into SQL creates severe SQL injection vulnerabilities.
   - *Solution:* Built dynamic `conditions` and `queryParams` arrays. All user inputs (`search_q`, `min_price`, `max_price`, `limit`, `offset`) are passed strictly via `?` placeholders. Column names (`order_by`) cannot be parameterized in SQL, so they are checked against an explicit `ALLOWED_COLUMNS` whitelist.

2. **JSON Serialization of Missing `await`:**
   - *Problem:* Forgetting `await` on `db.all()` did not throw an immediate syntax error, but the API returned `{}` to the client.
   - *Solution:* Identified that `JSON.stringify(new Promise(...))` serializes to `{}` because Promise internal states are non-enumerable. Audited every handler to guarantee `await` precedes all asynchronous operations.

3. **Consistent Error Payload Formatting:**
   - *Problem:* Lab 02 mixed error formats (`{ error: ... }` vs `{ message: ... }`).
   - *Solution:* Standardized all response objects across all routes and error handlers to `{ message: "..." }` as mandated by Lab 03 requirements.

---

## Viva & Technical Concepts

### 1. Query Parameter vs. Path Parameter
- **Path Parameter (`/books/:bookId`):** Identifies a specific resource or entity hierarchy. It is essential to the resource's identity (e.g., Book #5).
- **Query Parameter (`/books?search_q=Clean&limit=10`):** Used to filter, sort, paginate, or modify how the resource collection is returned. Query parameters are optional and do not change resource identity.

### 2. What does Stateless mean in REST?
In a stateless REST architecture, the server does not store any client session state between requests. Every incoming request must contain all information necessary to understand and process it (such as authentication tokens, parameters, and headers). This enables horizontal scaling and reliability.

### 3. Which status code for Bad Input vs. a Missing Record?
- **Bad Input (`400 Bad Request`):** Used when the client sends malformed JSON, missing required fields (e.g., missing title or author), or an invalid data type (e.g., non-numeric price or string book ID).
- **Missing Record (`404 Not Found`):** Used when the request syntax is valid, but the requested resource identifier does not exist in the database (e.g., `bookId = 9999`).

### 4. Preventing SQL Injection
SQL injection occurs when untrusted user input is directly concatenated into SQL query strings (`"WHERE title = '" + input + "'"`). In this project:
- All values are passed using **parameterized queries** (`?` placeholders).
- Dynamic sort columns (`ORDER BY`) are validated against a strict hardcoded whitelist (`['id', 'title', 'author', 'price', 'pages']`).

---

## Submission Checklist
- [x] RESTful endpoints using noun identifiers (`/books`, `/books/:bookId`)
- [x] Query parameters implemented (`search_q`, `order_by`, `order`, `limit`, `offset`)
- [x] Price range filtering (`min_price`, `max_price`)
- [x] Body validation for POST requests with `400 Bad Request` and clear error JSON
- [x] Standard status codes (`200`, `201`, `400`, `404`, `500`)
- [x] Consistent JSON response structure (`{ "message": "..." }`)
- [x] Four debugging scenarios documented and demonstrated
- [x] Automated test runner (`test_runner.js`) passing 100% of cases
- [x] Exported Postman collection (`postman_collection.json`)
- [x] `.gitignore` ensuring `node_modules/` and `.env` are never committed
- [x] Ready for deployment on Render (`render.yaml`)

