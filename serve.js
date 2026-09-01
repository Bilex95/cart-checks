// Zero-dependency static server + a tiny coupon endpoint, so the page works
// both when you open it manually and when Cypress drives it.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

const COUPONS = { SAVE10: 10, WELCOME5: 5 };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/coupon") {
    const code = (url.searchParams.get("code") || "").toUpperCase();
    const percentOff = COUPONS[code];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(percentOff ? { valid: true, percentOff } : { valid: false }));
    return;
  }

  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const full = path.join(ROOT, path.normalize(file));
  if (!full.startsWith(ROOT) || !fs.existsSync(full)) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(full)] || "text/plain" });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, () => console.log(`cart-checks on http://localhost:${PORT}`));
