const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static('public'));

// قاموس لتخزين المتصلين: { username: socketId }
const users = {};

io.on('connection', (socket) => {
    let currentUsername = '';

    // تسجيل اليوزر في السيرفر
    socket.on('register-user', (username) => {
        currentUsername = username;
        users[username] = socket.id;
        console.log(`تم تسجيل المستخدم: ${username} (ID: ${socket.id})`);

        // إرسال قائمة المتصلين للجميع
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

    // طلب اتصال خاص (WebRTC Call)
    socket.on('call-request', (data) => {
        const targetSocketId = users[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                fromUser: data.from,
                fromSocketId: socket.id
            });
        }
    });

    // الرد على الاتصال
    socket.on('call-response', (data) => {
        io.to(data.toSocketId).emit('call-status', {
            accepted: data.accepted,
            fromSocketId: socket.id
        });
    });

    // إشارات WebRTC للمكالمات الخاصّة
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

    // عند خروج المستخدم
    socket.on('disconnect', () => {
        if (currentUsername && users[currentUsername]) {
            delete users[currentUsername];
            io.emit('update-user-list', Object.keys(users));
            console.log(`المستخدم غادر: ${currentUsername}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
