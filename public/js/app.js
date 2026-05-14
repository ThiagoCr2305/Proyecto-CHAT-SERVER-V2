/* ════════════════════════════════════════
   APP  –  app.js
   Entry point: wires all modules together.
   ════════════════════════════════════════ */

'use strict';

(function () {

  // ── State ────────────────────────────────────────────────────────
  let roomId       = null;
  let pendingFiles = []; // FileList items queued for sending

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {

    UI.initColorPicker();

    // Pre-fill room code from URL  /chat/:roomId
    const match = location.pathname.match(/\/chat\/([^/]+)/);
    if (match) document.getElementById('room-code').value = match[1];

    // Lobby buttons
    document.getElementById('btn-create').addEventListener('click', _createRoom);
    document.getElementById('btn-join').addEventListener('click', _joinRoom);

    // Pressing Enter in the room-code field
    document.getElementById('room-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') _joinRoom();
    });
    document.getElementById('user-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') _createRoom();
    });

    // Chat controls
    document.getElementById('btn-share').addEventListener('click', _shareLink);
    document.getElementById('send-btn').addEventListener('click', _sendMessage);
    document.getElementById('btn-attach').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    // File input
    document.getElementById('file-input').addEventListener('change', _onFilesSelected);

    // Remove single file from preview
    document.getElementById('file-preview-inner').addEventListener('click', e => {
      if (e.target.classList.contains('preview-remove')) {
        const idx = parseInt(e.target.dataset.idx, 10);
        pendingFiles.splice(idx, 1);
        if (pendingFiles.length === 0) {
          UI.hideFilePreview();
        } else {
          UI.showFilePreview(pendingFiles);
        }
      }
    });

    // Cancel all queued files
    document.getElementById('btn-cancel-file').addEventListener('click', () => {
      pendingFiles = [];
      UI.hideFilePreview();
      document.getElementById('file-input').value = '';
    });

    // Textarea behaviour
    const input = document.getElementById('msg-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        _sendMessage();
      }
    });
    input.addEventListener('input', () => {
      // Auto-resize
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      Chat.notifyTyping();
    });

    // Lightbox close
    document.getElementById('lightbox').addEventListener('click', UI.closeLightbox);
    document.getElementById('lightbox-close').addEventListener('click', e => {
      e.stopPropagation();
      UI.closeLightbox();
    });

    // Drag-and-drop onto chat
    const chatView = document.getElementById('chat-view');
    chatView.addEventListener('dragover', e => { e.preventDefault(); });
    chatView.addEventListener('drop',     e => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length) _queueFiles(files);
    });
  });

  // ── Lobby actions ─────────────────────────────────────────────────
  function _createRoom() {
    const name = document.getElementById('user-name').value.trim();
    if (!name) { document.getElementById('user-name').focus(); return; }
    _enterChat(generateRoomId());
  }

  function _joinRoom() {
    const name = document.getElementById('user-name').value.trim();
    const code = document.getElementById('room-code').value.trim().toLowerCase();
    if (!name) { document.getElementById('user-name').focus(); return; }
    if (!code) { document.getElementById('room-code').focus(); return; }
    _enterChat(code);
  }

  function _enterChat(room) {
    roomId = room;
    const userName  = document.getElementById('user-name').value.trim() || 'Anónimo';
    const userColor = UI.getSelectedColor();

    UI.showChatView(room);
    history.pushState({}, '', `/chat/${room}`);
    Chat.connect({ room, userName, userColor });
    document.getElementById('msg-input').focus();
  }

  // ── Send ──────────────────────────────────────────────────────────
  async function _sendMessage() {
    const input = document.getElementById('msg-input');
    const text  = input.value.trim();

    // Send queued files first
    if (pendingFiles.length > 0) {
      const toSend = [...pendingFiles];
      pendingFiles = [];
      UI.hideFilePreview();
      document.getElementById('file-input').value = '';
      await Chat.uploadAndSendFiles(toSend);
    }

    // Then text
    if (text) {
      Chat.sendText(text);
      input.value      = '';
      input.style.height = 'auto';
    }
  }

  // ── Files ─────────────────────────────────────────────────────────
  function _onFilesSelected(e) {
    const files = Array.from(e.target.files);
    if (files.length) _queueFiles(files);
  }

  function _queueFiles(files) {
    const MAX = 50 * 1024 * 1024; // 50 MB per file
    const valid = files.filter(f => {
      if (f.size > MAX) {
        UI.showToast(`❌ "${f.name}" supera los 50 MB`, true);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    pendingFiles.push(...valid);
    UI.showFilePreview(pendingFiles);
  }

  // ── Share ──────────────────────────────────────────────────────────
  function _shareLink() {
    if (!roomId) return;
    const url = `${location.origin}/chat/${roomId}`;
    navigator.clipboard.writeText(url)
      .then(() => UI.showToast('¡Enlace copiado! 🎉'))
      .catch(() => UI.showToast('❌ No se pudo copiar', true));
  }

})();
