import { io } from 'socket.io-client';
import API_BASE from './api';

let socket: any;

const getSocket = () => {
    if (socket) return socket;

    // Use absolute URL if API_BASE is absolute, else use current host
    const isAbsolute = API_BASE.startsWith('http');
    const url = isAbsolute ? API_BASE.replace(/\/api$/, "") : undefined;

    socket = io(url, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO');
    });

    socket.on('connect_error', (err: any) => {
        console.error('❌ Socket.IO Connect Error:', err.message);
    });

    return socket;
};

export default getSocket;
