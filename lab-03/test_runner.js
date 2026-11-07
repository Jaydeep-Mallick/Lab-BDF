const http = require("http");

// Function to make HTTP requests
function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING BDF LAB 3 REST API VERIFICATION");
  console.log("==========================================\n");

  const baseUrl = {
    hostname: "localhost",
    port: 3000,
  };

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error("   Details:", details);
      failed++;
    }
  }

  try {
    // 1. GET all books
    let res = await request({ ...baseUrl, path: "/books", method: "GET" });
    assert(
      res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 10,
      "Test 1: GET all books (Default limit=10, 10 records returned)",
      res
    );

    // 2. GET a book using its ID
    res = await request({ ...baseUrl, path: "/books/1", method: "GET" });
    assert(
      res.statusCode === 200 && res.body.id === 1 && res.body.title === "To Kill a Mockingbird",
      "Test 2: GET book by ID (/books/1)",
      res
    );

    // 3. GET with search_q
    res = await request({ ...baseUrl, path: "/books?search_q=Great", method: "GET" });
    assert(
      res.statusCode === 200 && res.body.length === 1 && res.body[0].title === "The Great Gatsby",
      "Test 3: GET with search_q=Great",
      res
    );

    // 4. GET with order_by
    res = await request({ ...baseUrl, path: "/books?order_by=price", method: "GET" });
    assert(
      res.statusCode === 200 && res.body[0].price <= res.body[1].price,
      "Test 4: GET with order_by=price (default ASC)",
      res.body.map((b) => ({ title: b.title, price: b.price }))
    );

    // 5. GET with ASC
    res = await request({ ...baseUrl, path: "/books?order_by=price&order=ASC", method: "GET" });
    assert(
      res.statusCode === 200 && res.body[0].price === 250,
      "Test 5: GET with order_by=price&order=ASC (Animal Farm at 250 is first)",
      res.body.map((b) => ({ title: b.title, price: b.price }))
    );

    // 6. GET with DESC
    res = await request({ ...baseUrl, path: "/books?order_by=price&order=DESC", method: "GET" });
    assert(
      res.statusCode === 200 && res.body[0].price === 499,
      "Test 6: GET with order_by=price&order=DESC (The Hobbit at 499 is first)",
      res.body.map((b) => ({ title: b.title, price: b.price }))
    );

    // 7. GET with limit
    res = await request({ ...baseUrl, path: "/books?limit=3", method: "GET" });
    assert(
      res.statusCode === 200 && res.body.length === 3,
      "Test 7: GET with limit=3 (returns exactly 3 records)",
      res.body.length
    );

    // 8. GET with offset
    res = await request({ ...baseUrl, path: "/books?limit=3&offset=3", method: "GET" });
    assert(
      res.statusCode === 200 && res.body.length === 3 && res.body[0].id === 4,
      "Test 8: GET with limit=3&offset=3 (first record has id=4)",
      res.body[0]
    );

    // 9. GET with min_price and max_price
    res = await request({ ...baseUrl, path: "/books?min_price=300&max_price=400", method: "GET" });
    const allInRange = res.body.every((b) => b.price >= 300 && b.price <= 400);
    assert(
      res.statusCode === 200 && res.body.length > 0 && allInRange,
      "Test 9: GET with min_price=300&max_price=400",
      res.body.map((b) => ({ title: b.title, price: b.price }))
    );

    // 10. GET with multiple combined query parameters
    res = await request({
      ...baseUrl,
      path: "/books?search_q=o&min_price=300&max_price=450&order_by=price&order=DESC&limit=4&offset=0",
      method: "GET",
    });
    assert(
      res.statusCode === 200 &&
        res.body.length > 0 &&
        res.body.every(
          (b) =>
            b.title.toLowerCase().includes("o") &&
            b.price >= 300 &&
            b.price <= 450
        ),
      "Test 10: GET with combined search_q, min_price, max_price, order_by, order, limit",
      res.body
    );

    // 11. POST with valid data
    const validBook = {
      title: "Clean Code",
      author: "Robert C. Martin",
      price: 650,
      pages: 464,
    };
    res = await request(
      {
        ...baseUrl,
        path: "/books",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      validBook
    );
    const createdBookId = res.body.bookId;
    assert(
      res.statusCode === 201 &&
        res.body.message === "Book Added Successfully" &&
        typeof createdBookId === "number",
      "Test 11: POST with valid data (Returns 201 Created)",
      res.body
    );

    // 12. POST without title
    res = await request(
      {
        ...baseUrl,
        path: "/books",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { author: "Author", price: 200, pages: 100 }
    );
    assert(
      res.statusCode === 400 && res.body.message === "Title is required",
      "Test 12: POST without title (Returns 400 Bad Request)",
      res.body
    );

    // 13. POST without author
    res = await request(
      {
        ...baseUrl,
        path: "/books",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { title: "No Author Book", price: 200, pages: 100 }
    );
    assert(
      res.statusCode === 400 && res.body.message === "Author is required",
      "Test 13: POST without author (Returns 400 Bad Request)",
      res.body
    );

    // 14. POST with non-numeric price
    res = await request(
      {
        ...baseUrl,
        path: "/books",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { title: "Bad Price Book", author: "Author", price: "free", pages: 100 }
    );
    assert(
      res.statusCode === 400 && res.body.message === "Price must be a valid number",
      "Test 14: POST with non-numeric price (Returns 400 Bad Request)",
      res.body
    );

    // 15. PUT an existing book
    const updateData = {
      title: "Clean Code: Revised Edition",
      author: "Robert C. Martin",
      price: 700,
      pages: 480,
    };
    res = await request(
      {
        ...baseUrl,
        path: `/books/${createdBookId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      updateData
    );
    assert(
      res.statusCode === 200 && res.body.message === "Book Details Updated Successfully",
      "Test 15: PUT an existing book (Returns 200 OK)",
      res.body
    );

    // 16. PUT a nonexistent book
    res = await request(
      {
        ...baseUrl,
        path: "/books/9999",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      updateData
    );
    assert(
      res.statusCode === 404 && res.body.message === "Book not found",
      "Test 16: PUT a nonexistent book (Returns 404 Not Found)",
      res.body
    );

    // 17. DELETE an existing book
    res = await request({
      ...baseUrl,
      path: `/books/${createdBookId}`,
      method: "DELETE",
    });
    assert(
      res.statusCode === 200 && res.body.message === "Book Deleted Successfully",
      "Test 17: DELETE an existing book (Returns 200 OK)",
      res.body
    );

    // 18. DELETE a nonexistent book
    res = await request({
      ...baseUrl,
      path: "/books/9999",
      method: "DELETE",
    });
    assert(
      res.statusCode === 404 && res.body.message === "Book not found",
      "Test 18: DELETE a nonexistent book (Returns 404 Not Found)",
      res.body
    );

    // Verify GET on deleted book returns 404
    res = await request({
      ...baseUrl,
      path: `/books/${createdBookId}`,
      method: "GET",
    });
    assert(
      res.statusCode === 404 && res.body.message === "Book not found",
      "Bonus Check: GET deleted book returns 404 Not Found",
      res.body
    );

    console.log("\n==========================================");
    console.log(`TOTAL PASSED: ${passed} / ${passed + failed}`);
    console.log(`TOTAL FAILED: ${failed}`);
    console.log("==========================================");

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

// Start app and run tests after DB is initialized
require("./app.js");
setTimeout(runTests, 1500);

