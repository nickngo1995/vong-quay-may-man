const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = __dirname;
const publicDirectory = path.join(root, 'public');
const dataFile = path.join(root, 'data', 'store.json');
const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function readStore() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveStore(store) {
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryFile, dataFile);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 4096) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function choosePrize(prizes) {
  const totalWeight = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0);
  if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0) {
    throw new Error('Prize weights must add up to a positive integer');
  }

  let ticket = crypto.randomInt(totalWeight);
  for (let index = 0; index < prizes.length; index += 1) {
    ticket -= Math.max(0, Number(prizes[index].weight) || 0);
    if (ticket < 0) return index;
  }
  throw new Error('Unable to select a prize');
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/prizes') {
    const { prizes } = readStore();
    return sendJson(response, 200, {
      prizes: prizes.map(({ id, name, color }) => ({ id, name, color }))
    });
  }

  if (request.method === 'POST' && pathname === '/api/spin') {
    let payload;
    try {
      payload = await readRequestBody(request);
    } catch {
      return sendJson(response, 400, { error: 'Dữ liệu gửi lên không hợp lệ.' });
    }

    const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';
    if (!/^[A-Z0-9-]{4,40}$/.test(code)) {
      return sendJson(response, 400, { error: 'Vui lòng nhập mã hợp lệ.' });
    }

    const store = readStore();
    const entry = store.codes.find((item) => item.code.toUpperCase() === code);
    if (!entry) return sendJson(response, 404, { error: 'Mã không tồn tại. Hãy kiểm tra lại nhé.' });
    if (entry.usedAt) {
      const previousSpin = store.spins.find((spin) => spin.code === entry.code);
      return sendJson(response, 409, {
        error: 'Mã này đã được sử dụng.',
        prize: previousSpin ? previousSpin.prize : null
      });
    }

    let prizeIndex;
    try {
      prizeIndex = choosePrize(store.prizes);
    } catch {
      return sendJson(response, 500, { error: 'Danh sách quà chưa được cấu hình đúng.' });
    }

    const prize = store.prizes[prizeIndex];
    const spin = {
      code: entry.code,
      prize: prize.name,
      prizeId: prize.id,
      spunAt: new Date().toISOString()
    };
    entry.usedAt = spin.spunAt;
    entry.prizeId = prize.id;
    store.spins.push(spin);

    try {
      saveStore(store);
    } catch {
      return sendJson(response, 500, { error: 'Chưa lưu được lượt quay. Vui lòng thử lại.' });
    }

    return sendJson(response, 200, { prize, prizeIndex });
  }

  return sendJson(response, 404, { error: 'Không tìm thấy API.' });
}

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.resolve(publicDirectory, `.${requestedPath}`);
  if (!filePath.startsWith(`${publicDirectory}${path.sep}`)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('Not found');
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = new URL(request.url, 'http://localhost').pathname;
  } catch {
    response.writeHead(400);
    return response.end('Bad request');
  }

  if (pathname.startsWith('/api/')) {
    handleApi(request, response, pathname).catch(() => {
      sendJson(response, 500, { error: 'Đã có lỗi xảy ra.' });
    });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Method not allowed');
  }

  serveStatic(request, response, pathname);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Lucky wheel is running at http://localhost:${port}`);
});