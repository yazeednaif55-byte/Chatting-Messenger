const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('مستخدم متصل:', socket.id);

    // إرسال الـ ID الخاص بالمستخدم
    socket.emit('your-id', socket.id);

    // استقبال وإرسال الرسائل النصية
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    // طلب اتصال جديد لجميع المتواجدين
    socket.on('call-request', (data) => {
        socket.broadcast.emit('incoming-call', { 
            from: socket.id, 
            name: data.name 
        });
    });

    // الرد على الاتصال (قبول أو رفض)
    socket.on('call-response', (data) => {
        io.to(data.to).emit('call-status', { 
            accepted: data.accepted,
            from: socket.id 
        });
    });

    socket.on('disconnect', () => {
        console.log('مستخدم غادر:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
