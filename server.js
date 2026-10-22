const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    // إرسال معرف المستخدم
    socket.emit('your-id', socket.id);

    // الرسائل النصية
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    // طلب الاتصال
    socket.on('call-request', (data) => {
        socket.broadcast.emit('incoming-call', { 
            from: socket.id, 
            name: data.name 
        });
    });

    // رد الاتصال
    socket.on('call-response', (data) => {
        io.to(data.to).emit('call-status', { 
            accepted: data.accepted,
            from: socket.id 
        });
    });

    // --- إشارات نقل الصوت والفيديو (WebRTC Signaling) ---
    socket.on('webrtc-offer', (data) => {
        socket.to(data.to).emit('webrtc-offer', {
            sdp: data.sdp,
            from: socket.id
        });
    });

    socket.on('webrtc-answer', (data) => {
        socket.to(data.to).emit('webrtc-answer', {
            sdp: data.sdp,
            from: socket.id
        });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        socket.to(data.to).emit('webrtc-ice-candidate', {
            candidate: data.candidate,
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
