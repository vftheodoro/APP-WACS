const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const readline = require('readline');
const http = require('http');
const url = require('url');

const WS_PORT = process.env.WS_PORT || 3001;
const SERIAL_PORT_PATH = process.env.SERIAL_PORT || 'COM5';
let serialPort = null;
let parser = null;
let clients = new Set();

async function connectSerial(path) {
  if (!path) return;
  try {
    serialPort = new SerialPort({ path, baudRate: 9600, autoOpen: false });
    serialPort.open((err) => {
      if (err) return console.error('Erro ao abrir serial:', err.message);
      console.log('Serial aberta em', path);
    });
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    parser.on('data', data => {
      console.log('[ARDUINO]', data);
      for (const c of clients) {
        try { c.send(String(data)); } catch (e) {}
      }
    });
    serialPort.on('error', (err) => console.error('Serial error', err));
    serialPort.on('close', () => {
      console.log('Serial fechada');
      serialPort = null;
      parser = null;
    });
  } catch (e) {
    console.error('connectSerial error', e);
  }
}

// Immediately try to connect to the configured serial port (no auto-detection)
(async () => {
  try {
    console.log('Tentando conectar em', SERIAL_PORT_PATH);
    await connectSerial(SERIAL_PORT_PATH);
  } catch (e) {
    console.error('Erro ao conectar porta fixa', e);
  }
})();

// Track current connected path for status
let currentPortPath = SERIAL_PORT_PATH;

// Create HTTP server and attach WebSocket to it so we can expose HTTP endpoints
const httpServer = http.createServer(async (req, res) => {
  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const parsed = url.parse(req.url, true);
  if (req.method === 'GET' && parsed.pathname === '/ports') {
    // return list of serial ports
    try {
      const ports = await SerialPort.list();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ports));
      return;
    } catch (e) {
      res.writeHead(500); res.end(String(e)); return;
    }
  }

  if (req.method === 'POST' && parsed.pathname === '/connect') {
    // expect JSON { path: 'COM5' }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const path = (payload && payload.path) ? payload.path : SERIAL_PORT_PATH;
        // close existing serial to force reconnect
        if (serialPort && serialPort.isOpen) {
          try { serialPort.close(); } catch (e) { console.error('Erro fechando serial antes de reconectar', e); }
          serialPort = null;
        }
        // attempt immediate connect to provided path
        await connectSerial(path);
        currentPortPath = path;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path }));
        return;
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    return;
  }

  // Simple send endpoint: POST /send with raw text/plain or JSON { msg }
  if (req.method === 'POST' && parsed.pathname === '/send') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let toSend = body;
        // If Content-Type is JSON, try parse { msg }
        const ctype = req.headers['content-type'] || '';
        if (ctype.includes('application/json')) {
          const data = JSON.parse(body || '{}');
          toSend = (data && (data.msg || data.message || data.text)) || '';
        }
        if (!toSend) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'empty_message' }));
          return;
        }
        if (serialPort && serialPort.isOpen) {
          try {
            const exact = String(toSend);
            console.log('[HTTP /send] recebida mensagem:', exact);
            // Envia para a serial exatamente como recebido (sem newline)
            serialPort.write(exact);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, sent: exact }));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'serial_not_open' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }

  // status endpoint
  if (req.method === 'GET' && parsed.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ serialOpen: !!(serialPort && serialPort.isOpen), currentPortPath }));
    return;
  }

  res.writeHead(404); res.end('Not Found');
});

const wss = new WebSocket.Server({ server: httpServer });
httpServer.listen(WS_PORT, () => console.log(`HTTP+WS server rodando na porta ${WS_PORT}`));

wss.on('connection', (ws) => {
  console.log('Cliente WS conectado');
  clients.add(ws);
  ws.on('message', (msg) => {
    console.log('[WS IN]', msg.toString());
    // Enviar para serial se disponível
    if (serialPort && serialPort.isOpen) {
      try {
        serialPort.write(String(msg) + '\n');
      } catch (e) { console.error('Erro escrevendo na serial', e); }
    }
  });
  ws.on('close', () => { clients.delete(ws); console.log('Cliente WS desconectado'); });
  ws.on('error', (e) => console.error('WS error', e));
});

// Read from stdin and forward to serial
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => {
  console.log('[STDIN]', line);
  if (serialPort && serialPort.isOpen) {
    try { serialPort.write(String(line) + '\n'); } catch (e) { console.error('Erro escrevendo serial:', e); }
  } else {
    console.log('Serial não aberta - não foi possível enviar stdin para Arduino');
  }
});

// No periodic auto-detect - server uses fixed SERIAL_PORT_PATH unless restarted or updated via env

process.on('SIGINT', () => {
  console.log('Fechando servidor...');
  rl.close();
  for (const c of clients) c.terminate();
  if (serialPort && serialPort.isOpen) serialPort.close();
  process.exit(0);
});
