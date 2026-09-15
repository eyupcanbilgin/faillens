import { createServer } from "node:http";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Demo shop</title></head><body><h1>Demo shop</h1><p>Synthetic checkout — intentionally broken order service.</p><button>Place order</button><p role="status">Ready</p><script>
document.querySelector('button').onclick=async()=>{const r=await fetch('/api/orders',{method:'POST'});if(!r.ok){console.error('Order creation failed');document.querySelector('[role=status]').textContent='Order failed';}else{document.querySelector('[role=status]').textContent='Order confirmed';}};
</script></body></html>`;
createServer((req, res) => {
  if (req.url === "/api/orders") {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Synthetic service failure" }));
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(html);
}).listen(4179, "127.0.0.1");
