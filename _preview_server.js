// 简易静态文件预览服务（仅本地开发预览用）
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function listDir(dir, urlPath) {
  const items = fs.readdirSync(dir).map(name => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    return { name, isDir: stat.isDirectory() };
  });
  const links = items
    .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))
    .map(it => {
      const href = encodeURIComponent(it.name) + (it.isDir ? '/' : '');
      return `<li><a href="${href}">${it.name}${it.isDir ? '/' : ''}</a></li>`;
    })
    .join('');
  return `<!doctype html><meta charset="utf-8"><title>预览索引 - ${urlPath}</title>
<style>body{font-family:-apple-system,Segoe UI,sans-serif;padding:24px;max-width:720px;margin:0 auto}h1{font-size:18px;color:#333}ul{padding-left:20px;line-height:2}a{color:#1677ff;text-decoration:none}a:hover{text-decoration:underline}</style>
<h1>📁 ${urlPath}</h1><ul>${urlPath === '/' ? '' : '<li><a href="../">../</a></li>'}${links}</ul>`;
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, urlPath);

    // 防穿越
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('403 Forbidden'); return;
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 优先找 index.html / 列表页html
      const candidates = ['index.html', '咸亨产品奖励管理列表.html'];
      for (const c of candidates) {
        const cp = path.join(filePath, c);
        if (fs.existsSync(cp)) { filePath = cp; break; }
      }
      const finalStat = fs.statSync(filePath);
      if (finalStat.isDirectory()) {
        // 给目录索引
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(listDir(filePath, urlPath));
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Error: ' + e.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  const lanIPs = [];
  Object.values(ifaces).forEach(addrs => {
    (addrs || []).forEach(a => {
      if (a.family === 'IPv4' && !a.internal) lanIPs.push(a.address);
    });
  });
  console.log(`\n========== 预览服务已启动 ==========`);
  console.log(`本机访问:  http://localhost:${PORT}/咸亨产品奖励管理列表.html`);
  lanIPs.forEach(ip => {
    console.log(`局域网分享: http://${ip}:${PORT}/咸亨产品奖励管理列表.html`);
  });
  console.log(`\n服务目录: ${ROOT}`);
  console.log(`Ctrl+C 停止\n`);
});
