# 💬 LiveChat v2 – Chat en tiempo real con archivos
# Santiago Contreras - Wilber David Loaiza - Juan Manuel Perez Reyes
## 🚀 Instalación

```bash
cd chat-server-v2
npm install
npm start
```

El servidor muestra los enlaces de tu red local al arrancar.

---

## 📁 Estructura del proyecto

```
chat-server-v2/
├── server.js               ← Servidor Express + Socket.io + Multer
├── package.json
└── public/
    ├── index.html          ← HTML semántico (sólo estructura)
    ├── css/
    │   ├── lobby.css       ← Estilos de la pantalla de entrada
    │   └── chat.css        ← Estilos del chat, burbujas, archivos, lightbox
    ├── js/
    │   ├── utils.js        ← Funciones puras (formateo, iconos…)
    │   ├── ui.js           ← Módulo UI: renderizado de mensajes y vistas
    │   ├── chat.js         ← Módulo Chat: Socket.io + upload de archivos
    │   └── app.js          ← Entry point: conecta eventos y módulos
    └── uploads/            ← Archivos recibidos (se crea automáticamente)
```

---

## ✨ Funcionalidades

| Función | Detalle |
|---|---|
| Salas únicas | URL `/chat/abc123` compartible |
| Archivos | Imágenes, video, audio, PDF, ZIP, texto – hasta **50 MB** |
| Lightbox | Click en imagen para verla en pantalla completa |
| Preview | Previsualiza archivos antes de enviarlos |
| Drag & Drop | Arrastra archivos directamente al chat |
| Typing | Indicador de quién está escribiendo |
| Colores | Avatar con color personalizado por usuario |
| Online | Contador de personas en la sala |

---

## 📱 Compartir fuera de tu WiFi (ngrok)

```bash
npx ngrok http 3000
```

Obtendrás una URL pública tipo `https://abc123.ngrok.io`.
