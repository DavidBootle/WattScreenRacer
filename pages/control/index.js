import io from "socket.io-client"

// function startButton(socket) {
//     socket.emit('start');
// }

export default function Control() {
    let ManualOnly = true;
    return (
        <div>
            <text> {ManualOnly === true && "You are in manual start mode.\n"} </text>
            <text> {ManualOnly === false && "You are in automatic start mode.\n"} </text>   
        <div>
            <button>start</button>
            <button>reset</button>
            <button>stop early</button>
        </div></div>
    )
}