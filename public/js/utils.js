/* ════════════════════════════════════════
   UTILS  –  utils.js
   ════════════════════════════════════════ */

'use strict';

/**
 * Generate a short random room ID (6 chars)
 */
function generateRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Format a timestamp as HH:MM
 */
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns an emoji icon for a given mime type
 */
function mimeIcon(mimeType) {
  if (!mimeType) return '📎';
  if (mimeType.startsWith('image/'))       return '🖼️';
  if (mimeType.startsWith('video/'))       return '🎬';
  if (mimeType.startsWith('audio/'))       return '🎵';
  if (mimeType === 'application/pdf')      return '📄';
  if (mimeType === 'application/zip' ||
      mimeType === 'application/x-zip-compressed') return '🗜️';
  if (mimeType.startsWith('text/'))        return '📝';
  return '📎';
}

/**
 * Get first letter of a name (uppercase) for avatars
 */
function avatarLetter(name) {
  return (name || '?')[0].toUpperCase();
}
