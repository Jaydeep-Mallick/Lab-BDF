# Scenario B: Wrong Import Path (`MODULE_NOT_FOUND`)

## 1. Problem Description
When importing a local file, middleware, or database connector, a mistyped path triggers a fatal error on startup:

```bash
node:internal/modules/cjs/loader:1252
  throw err;
  ^

Error: Cannot find module '../database/sqlite'
Require stack:
- /Users/jaydeepmallick/Desktop/lab-03/app.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1249:15)
    at Module._load (node:internal/modules/cjs/loader:1075:27)
    at Module.require (node:internal/modules/cjs/loader:1337:19)
    at require (node:internal/modules/helpers:136:18)
    at Object.<anonymous> (/Users/jaydeepmallick/Desktop/lab-03/app.js:4:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/Users/jaydeepmallick/Desktop/lab-03/app.js' ]
}
```

## 2. Root Cause
In Node.js CommonJS module resolution:
1. `require("package-name")` searches inside `node_modules`.
2. `require("./file")` or `require("../file")` searches relative to the current file's directory.
Errors occur when:
- Wrong relative path level: using `../` when the file is in the same directory (`./`), or vice-versa.
- Misspelled filename or directory name (case sensitivity on Linux / cloud deployment).
- Missing npm package in `node_modules` because `npm install` was not executed.

## 3. How to Resolve

### Step 1: Check Current File vs Target Location
Always check relative depth:
- Current folder: `./`
- Parent folder: `../`
- Two levels up: `../../`

### Step 2: Use Absolute Path via `path.join(__dirname, ...)`
When referencing data files or databases:
```javascript
// INCORRECT:
const dbPath = "./books.db"; // depends on process.cwd() where command was launched

// CORRECT & ROBUST:
const path = require("path");
const dbPath = path.join(__dirname, "books.db");
```

### Step 3: Verify Exact Module Name
```javascript
// INCORRECT (typo):
const { open } = require("sql-ite"); // MODULE_NOT_FOUND

// CORRECT:
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
```

