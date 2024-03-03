import { useEffect } from "react";

export default function useSocket(socket) {
    useEffect(() => {
        fetch('/api/socket');
        socket.connect();

        socket.on('connect', () => {
            console.log('Websockets are connected to server.');
        })

        socket.on('disconnect', () => {
            console.log('Websockets have been disconnected from the server.');
        })

        return () => {
            socket.disconnect();
        };
    }, [socket]);
}