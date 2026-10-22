const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const users = {}; // { username: socketId }

io.on('connection', (socket) => {
    let currentUsername = '';

    // تسجيل اليوزر
    socket.on('register-user', (username) => {
        currentUsername = username;
        users[username] = socket.id;
        io.emit('update-user-list', Object.keys(users));
    });

    // إرسال رسالة خاصة
    socket.on('private-message', (data) => {
        const targetSocketId = users[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('private-message', {
                from: data.from,
                text: data.text
            });
        }
    });

    // حدث جاري الكتابة
    socket.on('typing', (data) => {
        const targetSocketId = users[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('typing', {
                from: data.from,
                isTyping: data.isTyping
            });
        }
    });

    // إشارات الاتصال والمكالمات
    socket.on('call-request', (data) => {
        const targetSocketId = users[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                fromUser: data.from,
                fromSocketId: socket.id
            });
        }
    });

    socket.on('call-response', (data) => {
        io.to(data.toSocketId).emit('call-status', {
            accepted: data.accepted,
            fromSocketId: socket.id
        });
    });

    socket.on('webrtc-offer', (data) => {
        io.to(data.toSocketId).emit('webrtc-offer', {
            sdp: data.sdp,
            fromSocketId: socket.id
        });
    });

    socket.on('webrtc-answer', (data) => {
        io.to(data.toSocketId).emit('webrtc-answer', {
            sdp: data.sdp,
            fromSocketId: socket.id
        });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        io.to(data.toSocketId).emit('webrtc-ice-candidate', {
            candidate: data.candidate,
            fromSocketId: socket.id
        });
    });

    socket.on('disconnect', () => {
        if (currentUsername && users[currentUsername]) {
            delete users[currentUsername];
            io.emit('update-user-list', Object.keys(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
