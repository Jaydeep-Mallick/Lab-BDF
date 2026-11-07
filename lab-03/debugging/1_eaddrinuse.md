# Scenario A: Port Conflict (`EADDRINUSE`)

## 1. Problem Description
When running `node app.js`, the process crashes with the following error:

```bash
node:events:496
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    ...
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1940:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

## 2. Root Cause
In TCP/IP networking, each network port (e.g., port `3000`) on an IP address can only be bound and listened to by a single active operating system process at any given time.
`EADDRINUSE` stands for **Error: Address Already In Use**. It occurs when:
1. An earlier instance of the Node.js application is still running in the background (often orphaned when a terminal was closed without stopping the server with `Ctrl+C`).
2. Another application (such as a frontend dev server, React app, Docker container, or another student's project) is already using port 3000.

## 3. How to Resolve

### Method 1: Find and Kill the Blocking Process (macOS / Linux)
Identify the process ID (PID) occupying port 3000:
```bash
lsof -i :3000
```
Example output:
```text
COMMAND   PID          USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    84321 jaydeepmallick   23u  IPv6 0x1234567890abcdef      0t0  TCP *:3000 (LISTEN)
```
Kill the offending process using its PID:
```bash
kill -9 84321
```

*(On Windows PowerShell, use: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process`)*

### Method 2: Configure Environment Variable `PORT`
Modify the application to accept a dynamic port via environment variables or a fallback:
```javascript
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}/`);
});
```
Then start the server on a different port:
```bash
PORT=3001 node app.js
```

