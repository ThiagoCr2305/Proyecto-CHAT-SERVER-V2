const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const multer     = require('multer');
const path       = require('path');
const os         = require('os');
const fs         = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;

// ── Uploads folder ──────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/', 'video/', 'audio/',
      'application/pdf',
      'application/zip',
      'text/'
    ];
    const ok = allowed.some(t => file.mimetype.startsWith(t));
    cb(null, ok);
  }
});

// ── Static & routes ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/chat/:room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo no válido o demasiado grande (máx. 50 MB)' });
  res.json({
    url:          `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType:     req.file.mimetype,
    size:         req.file.size
  });
});

// ── Room state ───────────────────────────────────────────────────────────────
const rooms = {}; // { roomId: [ { id, name, color } ] }

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join-room', ({ roomId, userName, userColor }) => {
    currentRoom = roomId;
    currentUser = { id: socket.id, name: userName, color: userColor };

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(currentUser);
    socket.join(roomId);

    socket.to(roomId).emit('user-joined', { user: currentUser });
    socket.emit('room-users', rooms[roomId].filter(u => u.id !== socket.id));
    io.to(roomId).emit('system-message', { text: `${userName} se unió al chat`, timestamp: Date.now() });

    console.log(`[${roomId}] ${userName} connected (${socket.id})`);
  });

  // Text message
  socket.on('send-message', ({ roomId, message }) => {
    if (!currentUser) return;
    io.to(roomId).emit('new-message', {
      id:        `${socket.id}-${Date.now()}`,
      user:      currentUser,
      type:      'text',
      text:      message,
      timestamp: Date.now()
    });
  });

  // File message  (url already saved by /upload endpoint)
  socket.on('send-file', ({ roomId, url, originalName, mimeType, size }) => {
    if (!currentUser) return;
    io.to(roomId).emit('new-message', {
      id:           `${socket.id}-${Date.now()}`,
      user:         currentUser,
      type:         'file',
      url,
      originalName,
      mimeType,
      size,
      timestamp:    Date.now()
    });
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    if (!currentUser) return;
    socket.to(roomId).emit('user-typing', { user: currentUser, isTyping });
  });

  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      rooms[currentRoom] = (rooms[currentRoom] || []).filter(u => u.id !== socket.id);
      io.to(currentRoom).emit('user-left',       { user: currentUser });
      io.to(currentRoom).emit('system-message',  { text: `${currentUser.name} salió del chat`, timestamp: Date.now() });
      console.log(`[${currentRoom}] ${currentUser.name} disconnected`);
    }
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  return Object.values(ifaces).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         💬  LIVE CHAT SERVER           ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Local:  http://localhost:${PORT}          ║`);
  ips.forEach(addr => {
    const url = `http://${addr}:${PORT}`;
    console.log(`║  Red:    ${url.padEnd(37)}║`);
  });
  console.log('╠════════════════════════════════════════╣');
  console.log('║  Comparte el enlace de Red con otros   ║');
  console.log('║  dispositivos en tu WiFi 📱            ║');
  console.log('╚════════════════════════════════════════╝\n');
});
