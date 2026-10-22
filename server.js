const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// قراءة ملفات الواجهة من مجلد public
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل بالسيرفر');

  // استقبال الرسالة وإرسالها لكل المتصلين فوراً
  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    console.log('مستخدم غادر الدردشة');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
