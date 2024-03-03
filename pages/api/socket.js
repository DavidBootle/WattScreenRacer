import { Server } from "socket.io"

/**
 * @typedef {Object} Data
 * @property {number} position
 * @property {String} color
 */

let globaldata = {
    enabled: false,
    timerOn: false,
    players: {},
    count: 0,
    winner: null,
}

export default function handler(req, res) {

    if (res.socket.server.io) {
        res.end();
        return;
    }
    console.log('Socket is initializing');

    const io = new Server({ path: "/api/socket", addTrailingSlash: false, cors: { origin: "*" }});
    if (res.socket.server.io) {
        console.log('Socket is already running')
    } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io
    }

    /**
     * Called when the position update is reported from the camera.
     * @param {Socket} socket The websocket object from socket.io
     * @param {Data[]} data Incoming data from camera
     */
    function onPositionUpdate(socket, data) {
        // do nothing if not racing
        if (globaldata.enabled === false) {
            return;
        }
        // start the race automatically if they start running.
        if (globaldata.timerOn === false) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].position > 0) {
                    socket.emit('race_start');
                    globaldata.timerOn === true;
                }
            }
            /* // we might want this idk yet
            if (globaldata.timerOn === false)
                return;
            */
        }

        // Javascript wizardry
        data = data.map((value, index, array) => {
            let id = globaldata.players[value.color];
            if (id === undefined) {
                globaldata.players[value.color] = (globaldata.count)++;
                id = globaldata.players[value.color];
            }

            return {
                ...value,
                "id": id,
            }
        })
        // send to scoreboard
        socket.emit('score_update', data);

        let all_finished = true;
        // when player has position 1, tell scoreboard that they finished
        for (let i = 0; i < data.length; i++) {
            if (data[i].position >= 1) {
                socket.emit('player_finish', data[i].id);
                if (!globaldata.winner) {
                    globaldata.winner = data[i].id;
                }
            }
            if (data[i].position < 1) {
                all_finished = false;
            }
        }
        // the race is over when all players finished
        if (all_finished === true) {
            globaldata.enabled = false;
            socket.emit('race_stop', globaldata.winner);
        }

    }

    function onStartUpdate(socket) {
        // this is a manual start. I am thinking we should use automatic start
        // instead mainly, but we could have a control emit to set to manual mode
        // if we want to have options.
        socket.emit('race_start');
        globaldata.enabled = true;
    }

    function onStop(socket) {
        socket.emit('race_stop');
        globaldata.enabled = false;
    }

    function onreset(socket) {
        socket.emit('race_reset')
        globaldata.timerOn = false;
        globaldata.enabled = true;
        globaldata.players = {};
        globaldata.count = 0;
    }

    // if we use this
    function onToggle(socket) {
        globaldata.ManualOnly = !(globaldata.ManualOnly);
        socket.emit('ManualOnlyToggle', globaldata.ManualOnly);
    }


    io.on('connection', (socket) => {
        socket.on('pos_update', (data) => onPositionUpdate(socket, data));
        socket.on('start', () => onStartUpdate(socket));
        socket.on('stop', () => onStop(socket));
        socket.on('reset', () => onreset(socket));
        socket.on('togglemanual', () => onToggle(socket))
    });

    res.end();
}

