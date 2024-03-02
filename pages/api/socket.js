import { server } from 'Socket.IO'

/**
 * @typedef {Object} Data
 * @property {number} position
 * @property {String} color
 */

let globaldata = {
    running: false,
    players: {},
    count: 0
} 

export default function handler(req, res) {

    if (res.socket.server.io) {
        console.log('Socket is already running')
    } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io
    }
    res.end()

    /**
     * Called when the position update is reported from the camera.
     * @param {Socket} socket The websocket object from socket.io
     * @param {Data[]} data Incoming data from camera
     */
    function onPositionUpdate(socket, data) {
        // do nothing if not racing
        if (globaldata.running === false) {
            return;
        }
        
        for (let i = 0; i < data.length; i++) {
            let id = globaldata.players[data.color];
            if (id === undefined) {
                globaldata.players[data.color] = count++;
            }
        }

        data = data.map((value, index, array) => {
            return {
                ...value,
                "id": id,
            }
        })

        let all_finished = true;
        // when player has position 1, tell scoreboard that they finished
        for (let i = 0; i < data.length; i++) {
            if (data[i].position >= 1) {
                socket.emit('player_finish', data[i].color);
            }
            if (data[i].position < 1) {
                all_finished = false;   
            }            
        }
        // the race is over when all players finished
        if (all_finished === true) {
            globaldata.running = false;
            socket.emit('race_stop');
        }

    }

    function onStartUpdate(socket) {
        
        socket.emit('race_start');
        globaldata.running = true;
    }

    function onStop(socket) {
        socket.emit('race_stop');
        globaldata.running = false;
    }

    io.on('connection', (socket) => {
        socket.on('pos_update', (data) => onPositionUpdate(socket, data));
        socket.on('start', () => onStartUpdate(socket));
        socket.on('stop', () => onStop(socket));
        socket.on('reset', () => onreset(socket));
    })
}

