/* ════════════════════════════════════════
   UI  –  ui.js
   Handles all DOM rendering.
   ════════════════════════════════════════ */

'use strict';

const UI = (() => {

  // ── Colour palette ──────────────────────────────────────────────
  const COLORS = ['#7c6aff','#ff6a9c','#4affa0','#ffb347','#60cdff','#ff6060','#e879f9','#a3e635'];
  let selectedColor = COLORS[0];

  // ── Build color picker ──────────────────────────────────────────
  function initColorPicker() {
    const container = document.getElementById('color-picker');
    COLORS.forEach((c, i) => {
      const dot = document.createElement('div');
      dot.className = 'color-dot' + (i === 0 ? ' active' : '');
      dot.style.background = c;
      dot.addEventListener('click', () => {
        container.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        selectedColor = c;
      });
      container.appendChild(dot);
    });
  }

  function getSelectedColor() { return selectedColor; }

  // ── Toast ───────────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = isError ? 'show error' : 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 2800);
  }

  // ── Lightbox ────────────────────────────────────────────────────
  function openLightbox(src) {
    const lb   = document.getElementById('lightbox');
    const img  = document.getElementById('lightbox-img');
    img.src    = src;
    lb.classList.remove('hidden');
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
    document.getElementById('lightbox-img').src = '';
  }

  // ── Switch views ────────────────────────────────────────────────
  function showChatView(roomId) {
    document.getElementById('lobby').style.display     = 'none';
    const cv = document.getElementById('chat-view');
    cv.style.display = 'flex';
    document.getElementById('display-room-id').textContent = `sala: ${roomId}`;
  }

  // ── Online counter ──────────────────────────────────────────────
  function setOnlineCount(n) {
    document.getElementById('online-count').textContent = n;
  }

  // ── Typing indicator ────────────────────────────────────────────
  function setTyping(userName, isTyping) {
    document.getElementById('typing-indicator').textContent =
      isTyping ? `${userName} está escribiendo…` : '';
  }

  // ── System message ──────────────────────────────────────────────
  function appendSystemMsg(text) {
    const el = document.createElement('div');
    el.className   = 'sys-msg';
    el.textContent = `— ${text} —`;
    _appendAndScroll(el);
  }

  // ── Message ─────────────────────────────────────────────────────
  function appendMessage(msg, myId) {
    const isOwn = msg.user.id === myId;

    const wrapper = document.createElement('div');
    wrapper.className = `msg ${isOwn ? 'own' : 'other'}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className         = 'avatar';
    avatar.style.background  = msg.user.color + '33';
    avatar.style.color       = msg.user.color;
    avatar.textContent       = avatarLetter(msg.user.name);

    // Body
    const body = document.createElement('div');
    body.className = 'msg-body';

    // Sender name (only for others)
    if (!isOwn) {
      const nameEl        = document.createElement('div');
      nameEl.className    = 'msg-name';
      nameEl.style.color  = msg.user.color;
      nameEl.textContent  = msg.user.name;
      body.appendChild(nameEl);
    }

    // Content
    const content = msg.type === 'file'
      ? _buildFileBubble(msg)
      : _buildTextBubble(msg.text, isOwn);

    // Time
    const time        = document.createElement('div');
    time.className    = 'msg-time';
    time.textContent  = formatTime(msg.timestamp);

    body.appendChild(content);
    body.appendChild(time);

    if (!isOwn) wrapper.appendChild(avatar);
    wrapper.appendChild(body);
    if (isOwn)  wrapper.appendChild(avatar);

    _appendAndScroll(wrapper);
  }

  // ── File preview bar ────────────────────────────────────────────
  function showFilePreview(files) {
    const bar   = document.getElementById('file-preview-bar');
    const inner = document.getElementById('file-preview-inner');
    inner.innerHTML = '';

    files.forEach((file, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'preview-thumb';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src   = URL.createObjectURL(file);
        thumb.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src   = URL.createObjectURL(file);
        thumb.appendChild(vid);
      } else {
        const pill         = document.createElement('div');
        pill.className     = 'preview-file-pill';
        pill.innerHTML     = `${mimeIcon(file.type)} <span>${file.name}</span>`;
        thumb.appendChild(pill);
      }

      const removeBtn       = document.createElement('button');
      removeBtn.className   = 'preview-remove';
      removeBtn.textContent = '✕';
      removeBtn.dataset.idx = idx;
      thumb.appendChild(removeBtn);

      inner.appendChild(thumb);
    });

    bar.classList.remove('hidden');
  }

  function hideFilePreview() {
    document.getElementById('file-preview-bar').classList.add('hidden');
    document.getElementById('file-preview-inner').innerHTML = '';
  }

  // ── Private helpers ─────────────────────────────────────────────

  function _buildTextBubble(text, isOwn) {
    const bubble       = document.createElement('div');
    bubble.className   = 'bubble';
    bubble.textContent = text;
    return bubble;
  }

  function _buildFileBubble(msg) {
    const { url, mimeType, originalName, size } = msg;
    const wrapper = document.createElement('div');
    wrapper.className = 'file-bubble';

    if (mimeType && mimeType.startsWith('image/')) {
      const img   = document.createElement('img');
      img.src     = url;
      img.alt     = originalName;
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(url));
      wrapper.appendChild(img);

    } else if (mimeType && mimeType.startsWith('video/')) {
      const vid      = document.createElement('video');
      vid.src        = url;
      vid.controls   = true;
      vid.preload    = 'metadata';
      wrapper.appendChild(vid);

    } else if (mimeType && mimeType.startsWith('audio/')) {
      const aud     = document.createElement('audio');
      aud.src       = url;
      aud.controls  = true;
      aud.preload   = 'metadata';
      wrapper.appendChild(aud);

    } else {
      const link       = document.createElement('a');
      link.className   = 'file-card';
      link.href        = url;
      link.target      = '_blank';
      link.download    = originalName;
      link.innerHTML   = `
        <span class="file-card-icon">${mimeIcon(mimeType)}</span>
        <span class="file-card-info">
          <span class="file-card-name">${_esc(originalName)}</span>
          <span class="file-card-size">${formatBytes(size || 0)}</span>
        </span>`;
      wrapper.appendChild(link);
    }

    return wrapper;
  }

  function _appendAndScroll(el) {
    const container = document.getElementById('messages');
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Public API ──────────────────────────────────────────────────
  return {
    initColorPicker,
    getSelectedColor,
    showToast,
    openLightbox,
    closeLightbox,
    showChatView,
    setOnlineCount,
    setTyping,
    appendSystemMsg,
    appendMessage,
    showFilePreview,
    hideFilePreview,
  };

})();
