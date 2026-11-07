# Scenario D: Missing `await` in Asynchronous Operations

## 1. Problem Description
When calling an asynchronous function (such as `db.all()`, `db.get()`, or `db.run()`) without the `await` keyword:
1. The endpoint returns an empty object `{}` instead of the data in the JSON response, or:
2. The endpoint responds to the client before the database query has completed, or:
3. Unhandled promise rejections occur if the query encounters an error later in the event loop.

Example broken code:
```javascript
app.get("/books", async (req, res) => {
  // BUG: Missing await! db.all() returns a Promise object, not the resolved rows
  const books = db.all("SELECT * FROM book;");
  
  // JSON.stringify on a pending Promise produces an empty object: {}
  res.status(200).json(books);
});
```

Client receives:
```json
{}
```
Instead of:
```json
[
  { "id": 1, "title": "To Kill a Mockingbird", "author": "Harper Lee", ... }
]
```

## 2. Root Cause
In Node.js, SQLite operations through the `sqlite` wrapper are asynchronous and return JavaScript `Promise` instances.
When `await` is omitted:
- Execution continues synchronously to the next statement immediately.
- `books` holds `Promise { <pending> }`.
- When Express passes `books` to `res.json()`, `JSON.stringify(new Promise(...))` serializes it as `{}` because Promises have no enumerable own properties.
- Any error thrown inside the Promise happens asynchronously outside the `try/catch` block, causing unhandled promise rejections.

## 3. How to Resolve

### Fix: Add `await` Before Every Asynchronous Database Call
Always ensure that every call to `db.all()`, `db.get()`, or `db.run()` is awaited inside an `async` function handler:

```javascript
// INCORRECT (Missing await):
const books = db.all(getBooksQuery);
res.status(200).json(books); // Sends {}

// CORRECT (With await):
const books = await db.all(getBooksQuery);
res.status(200).json(books); // Sends [{ id: 1, title: "..." }]
```

