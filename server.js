const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error("Request is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/status") {
    return send(res, 200, {
      provider: process.env.VIDEO_PROVIDER || "demo",
      configured: Boolean(process.env.VIDEO_API_KEY && process.env.VIDEO_API_URL),
      mode: (process.env.VIDEO_PROVIDER || "demo") === "demo" ? "demo" : "provider"
    });
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    let body;
    try { body = await readBody(req); }
    catch (err) { return send(res, 400, { error: err.message }); }

    const prompt = String(body.prompt || "").trim();
    if (prompt.length < 8) return send(res, 400, { error: "Please write a more detailed prompt (at least 8 characters)." });
    if (prompt.length > 1500) return send(res, 400, { error: "Prompt must be 1,500 characters or fewer." });

    // Provider integration deliberately fails closed until a provider-specific adapter is added.
    // Do not forward arbitrary user-supplied URLs or expose API keys to the browser.
    if ((process.env.VIDEO_PROVIDER || "demo") !== "demo") {
      if (!process.env.VIDEO_API_KEY || !process.env.VIDEO_API_URL) {
        return send(res, 503, { error: "Video provider credentials are not configured on the server yet." });
      }
      return send(res, 501, {
        error: "Your provider credentials are present, but the provider-specific API adapter still needs to be added in server.js. See README.md."
      });
    }

    return send(res, 200, {
      mode: "demo",
      message: "Demo request received. Connect a video provider to render a real video.",
      job: {
        id: "demo-" + Date.now(),
        prompt,
        status: "demo",
        createdAt: new Date().toISOString()
      }
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { error: "Method not allowed" });
  }

  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(PUBLIC, "." + requested);
  if (!filePath.startsWith(PUBLIC + path.sep)) return send(res, 403, { error: "Forbidden" });

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Nova AI is running at http://localhost:${PORT}`));
