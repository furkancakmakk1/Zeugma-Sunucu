// server.js
// Furkan Çakmak - Telemetry Dashboard Backend
// Express + Socket.IO gerçek zamanlı telemetri servisi

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Static klasör (Frontend)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Başlangıç telemetri verileri
let state = {
    hiz: 0,
    sicaklik: 25,
    voltaj: 48,
    enerji: 5000,
    sarj: 100,
    timestamp: new Date().toISOString()
};

// Dinamik hedef değerler
let target = {
    hiz: 0,
    enerji: state.enerji,
    sarj: state.sarj
};

// Her 5 saniyede yeni hedef değer üret
setInterval(() => {
    target.hiz = Math.floor(Math.random() * 121); // 0–120 km/h
    target.enerji = Math.max(0, state.enerji - Math.floor(Math.random() * 200));
    target.sarj = Math.floor(Math.random() * 101);
}, 5000);

// Telemetriyi her saniye güncelle
setInterval(() => {
    const delta = Math.random() * 3;

    // Hız hedefe yaklaşır
    if (state.hiz < target.hiz) state.hiz += delta;
    else state.hiz -= delta;
    state.hiz = Math.max(0, state.hiz);

    // Sıcaklık (hıza bağlı)
    state.sicaklik = 30 + state.hiz * 0.15 + (Math.random() * 4 - 2);

    // Voltaj hafif oynar
    state.voltaj = 48 + (Math.random() - 0.5);

    // Enerji tüketimi
    const loss = state.hiz * 0.25 + (Math.random() * 5);
    state.enerji = Math.max(0, state.enerji - loss);

    // Şarj yüzdesi enerjiye göre hesaplanır
    state.sarj = (state.enerji / 5000) * 100;

    // Formatlama
    state = {
        hiz: Number(state.hiz.toFixed(1)),
        sicaklik: Number(state.sicaklik.toFixed(1)),
        voltaj: Number(state.voltaj.toFixed(2)),
        enerji: Number(state.enerji.toFixed(1)),
        sarj: Number(state.sarj.toFixed(1)),
        timestamp: new Date().toISOString()
    };

    // Terminal çıktısı
    console.log("Telemetry:", state);

    // Frontend'e gönder
    io.emit("telemetry", state);
}, 1000);

// API Endpoint (JSON çıkış)
app.get("/telemetry", (req, res) => {
    res.json(state);
});

// Yeni websocket bağlantısı
io.on("connection", (socket) => {
    console.log("Yeni bağlantı:", socket.id);
    socket.emit("telemetry", state);
});

// Sunucuyu başlat
server.listen(PORT, () => {
    console.log(`Telemetry endpoint → http://localhost:${PORT}/telemetry`);
});