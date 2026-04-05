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
        // silent
    });

    socket.on('connect_error', (err: any) => {
        // silent
    });

    return socket;
};

export default getSocket;
