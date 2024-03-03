import { Server } from "socket.io";
import cors from "cors";
import { createRouter } from 'next-connect';

/**
 * @typedef {Object} Data
 * @property {number} position
 * @property {String} color
 */

let globaldata = {
    enabled: true,
    timerOn: false,
    players: {},
    count: 0,
    winner: -1,
    ManualOnly: false,
    previousdata: null,
    image: null,
}

const max_change = .2;

/**
 * Called when the position update is reported from the camera.
 * @param {Socket} socket The websocket object from socket.io
 * @param {Data[]} data Incoming data from camera
 */
function onPositionUpdate(emit, data) {
    // do nothing if not racing
    if (globaldata.enabled === false) {
        return;
    }
    if (globaldata.ManualOnly === false) {
    // start the race automatically if they start running.
        if (globaldata.timerOn === false) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].position > 0) {
                    emit('race_start');
                    globaldata.timerOn = true;
                    break;
                }
            }
        }
    }
        // we might want this idk yet
        if (globaldata.timerOn === false)
            return;
           
    

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

    /*if (previousdata !== null) {
        
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i].position)
        }
    }*/
    // send to scoreboard
    emit('score_update', data, image);
    //previousdata = data;
    let all_finished = true;
    // when player has position 1, tell scoreboard that they finished
    for (let i = 0; i < data.length; i++) {
        if (data[i].position >= 1) {
            emit('player_finish', data[i].id);
            if (globaldata.winner === -1) {
                globaldata.winner = data[i].id;
                globaldata.image = image
            }
        }
        if (data[i].position < 1) {
            all_finished = false;
        }
    }
    // the race is over when all players finished
    if (all_finished === true) {
        globaldata.enabled = false;
        emit('race_finished', globaldata.winner, globaldata.image);
    }

}

function onStartUpdate(emit) {
    // this is a manual start. I am thinking we should use automatic start
    // instead mainly, but we could have a control emit to set to manual mode
    // if we want to have options.
    emit('race_start');
    globaldata.enabled = true;
}

function onStop(emit) {
    emit('race_finished', globaldata.winner, globaldata.image);
    globaldata.enabled = false;
}

function onreset(emit) {
    emit('race_reset')
    globaldata.timerOn = false;
    globaldata.enabled = true;
    globaldata.players = {};
    globaldata.count = 0;
    globaldata.winner = -1;
    globaldata.previousdata = null;
}

// if we use this
function onToggle(emit) {
    globaldata.ManualOnly = !(globaldata.ManualOnly);
}

const router = createRouter();

// Enable CORS
router.use(cors());

router.all((req, res) => {
    if (res.socket.server.io) {
        console.log("Already set up");
        res.end();
        return;
    }

    const io = new Server(res.socket.server);

    // Event handler for client connections
    io.on("connection", (socket) => {

        function emit(...args) {
            io.emit(...args);
        }

        const clientId = socket.id;
        console.log("A client connected");
        console.log(`A client connected. ID: ${clientId}`);

        // Event handler for receiving messages from the client
        socket.on("message", (data) => {
            console.log("Received message:", data);
        });

        // Event handler for client disconnections
        socket.on("disconnect", () => {
            console.log("A client disconnected.");
        });

        socket.on('pos_update', (data) => onPositionUpdate(emit, data, image));
        socket.on('start', () => onStartUpdate(emit));
        socket.on('stop', () => onStop(emit));
        socket.on('reset', () => onreset(emit));
        socket.on('togglemanual', () => onToggle(emit))
    });

    res.socket.server.io = io;
    res.end();
});

export default router.handler();

function newHandler(req, res) {

    if (res.socket.server.io) {
        console.log("Already set up");
        res.end();
        return;
    }

    const io = new Server(res.socket.server);



    // if (res.socket.server.io) {
    //     res.end();
    //     return;
    // }

    // const io = new Server({ path: "/api/socket", addTrailingSlash: false, cors: { origin: "*" }});
    // if (res.socket.server.io) {
    //     console.log('Socket is already running')
    // } else {
    //     console.log('Socket is initializing')
    //     const io = new Server(res.socket.server)
    //     res.socket.server.io = io
    // }


    io.on('connection', (socket) => {
        console.log("connection established");
        
    });

    res.end();
}

