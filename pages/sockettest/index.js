import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
const socket = io();
import useSocket from '../../src/useSocket';

export default function SocketTest() {

    useSocket(socket);

    return (
        <div>
            <h1>Socket Test</h1>
            <button onClick={() => {
                socket.emit('pos_update', [
                    {
                        position: 0.3,
                        color: 'red', 
                    },
                    {
                        position: 0.7,
                        color: 'green',
                    }
                ])
            }}>Send Data</button>
            <button onClick={() => {
                socket.emit('start');
            }}>Start</button>
        </div>
    )
}