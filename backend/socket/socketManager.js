import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('setup', (userData) => {
            if(userData && userData._id) {
                socket.join(userData._id);
                socket.emit('connected');
                console.log('User joined their personal room:', userData._id);
            }
        });

        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log('User Joined Room:', room);
        });

        socket.on('typing', (room) => socket.in(room).emit('typing'));
        socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

        socket.on('new_message', (newMessageReceived) => {
            var chat = newMessageReceived.chat;

            if (!chat || !chat.users) return console.log('chat.users not defined');

            chat.users.forEach((user) => {
                if (user._id == newMessageReceived.sender._id) return;
                socket.in(user._id).emit('message_received', newMessageReceived);
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
