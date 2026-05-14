/* ════════════════════════════════════════
   CHAT  –  chat.js
   Socket.io connection + file upload logic.
   ════════════════════════════════════════ */

'use strict';

const Chat = (() => {

  let socket      = null;
  let roomId      = null;
  let myId        = null;
  let myUser      = null;          // { id, name, color }
  let typingTimer = null;
  const onlineUsers = new Set();

  // ── Connect ──────────────────────────────────────────────────────
  function connect({ room, userName, userColor }) {
    roomId = room;
    myUser = { name: userName, color: userColor };

    socket = io();

    socket.on('connect', () => {
      myId        = socket.id;
      myUser.id   = myId;
      socket.emit('join-room', { roomId, userName, userColor });
    });

    socket.on('room-users', (users) => {
      users.forEach(u => onlineUsers.add(u.id));
      onlineUsers.add(socket.id);
      UI.setOnlineCount(onlineUsers.size);
    });

    socket.on('user-joined', ({ user }) => {
      onlineUsers.add(user.id);
      UI.setOnlineCount(onlineUsers.size);
    });

    socket.on('user-left', ({ user }) => {
      onlineUsers.delete(user.id);
      UI.setOnlineCount(onlineUsers.size);
    });

    socket.on('new-message',    (msg) => UI.appendMessage(msg, myId));
    socket.on('system-message', ({ text }) => UI.appendSystemMsg(text));

    socket.on('user-typing', ({ user, isTyping }) => {
      if (user.id === myId) return;
      UI.setTyping(user.name, isTyping);
    });
  }

  // ── Send text ────────────────────────────────────────────────────
  function sendText(text) {
    if (!text || !socket) return;
    socket.emit('send-message', { roomId, message: text });
    _stopTyping();
  }

  // ── Upload & send files ──────────────────────────────────────────
  async function uploadAndSendFiles(files) {
    for (const file of files) {
      await _uploadFile(file);
    }
  }

  async function _uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res  = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al subir');

      socket.emit('send-file', {
        roomId,
        url:          data.url,
        originalName: data.originalName,
        mimeType:     data.mimeType,
        size:         data.size,
      });
    } catch (err) {
      UI.showToast(`❌ ${err.message}`, true);
    }
  }

  // ── Typing events ────────────────────────────────────────────────
  function notifyTyping() {
    if (!socket) return;
    socket.emit('typing', { roomId, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(_stopTyping, 1500);
  }

  function _stopTyping() {
    clearTimeout(typingTimer);
    if (socket) socket.emit('typing', { roomId, isTyping: false });
  }

  // ── Public ───────────────────────────────────────────────────────
  return { connect, sendText, uploadAndSendFiles, notifyTyping };

})();
