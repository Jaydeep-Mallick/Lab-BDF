/**
 * Demonstration of Scenario A: EADDRINUSE Port Conflict Handling
 * Run with: node debugging/1_eaddrinuse_demo.js
 */
const http = require("http");

const PORT = 3055;

// Server 1 binds to PORT 3055
const server1 = http.createServer((req, res) => {
  res.end("Server 1");
});

server1.listen(PORT, () => {
  console.log(`[Server 1] Successfully started on port ${PORT}`);

  // Server 2 attempts to bind to the SAME port (PORT 3055)
  const server2 = http.createServer((req, res) => {
    res.end("Server 2");
  });

  server2.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`\n[Server 2 Error Caught] EADDRINUSE detected! Port ${PORT} is occupied.`);
      console.log("[Resolution] Automatically falling back to an alternate port: " + (PORT + 1));
      
      // Fallback resolution
      server2.listen(PORT + 1, () => {
        console.log(`[Server 2] Successfully started on fallback port ${PORT + 1}!`);

        // Clean up both servers after demo
        server1.close();
        server2.close();
        console.log("\nDemo completed successfully: EADDRINUSE explained and handled.\n");
      });
    } else {
      console.error(err);
    }
  });

  server2.listen(PORT);
});

