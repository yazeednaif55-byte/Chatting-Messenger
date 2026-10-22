const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.static('public')); // ربط مجلد public مع الـ HTML

const activeUsers = {};

io.on('connection', (socket) => {
  console.log('مستخدم متصل بالسيرفر:', socket.id);

  // 1. تسجيل المستخدم
  socket.on('register', (username) => {
    if (username) {
      activeUsers[username] = socket.id;
      socket.username = username;
      io.emit('onlineUsers', Object.keys(activeUsers));
    }
  });

  // 2. إرسال الرسائل
  socket.on('chatMessage', (data) => {
    const targetSocketId = activeUsers[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('chatMessage', {
        from: socket.username,
        message: data.message
      });
    }
  });

  // 3. WebRTC Signaling (Offer, Answer, ICE)
  socket.on('offer', (data) => {
    const targetSocketId = activeUsers[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', { offer: data.offer, from: socket.username });
    }
  });

  socket.on('answer', (data) => {
    const targetSocketId = activeUsers[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', { answer: data.answer, from: socket.username });
    }
  });

  socket.on('ice-candidate', (data) => {
    const targetSocketId = activeUsers[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { candidate: data.candidate, from: socket.username });
    }
  });

  // 4. إلغاء وقفل المكالمة وتنبيه الجوال الثاني فوراً
  socket.on('endCall', (data) => {
    let targetSocketId = data.to;
    if (activeUsers[data.to]) {
      targetSocketId = activeUsers[data.to];
    }

    if (targetSocketId) {
      io.to(targetSocketId).emit('callEnded', {
        from: socket.username
      });
    }
  });

  // 5. قطع الاتصال
  socket.on('disconnect', () => {
    if (socket.username) {
      delete activeUsers[socket.username];
      io.emit('onlineUsers', Object.keys(activeUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر يعمل بنجاح على المنفذ: ${PORT}`);
});
