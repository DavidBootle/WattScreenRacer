import { useEffect } from "react";

export default function useSocket(socket) {
    useEffect(() => {
        fetch('/api/socket');
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, [socket]);
}