import io from "socket.io-client"
import styles from "./control.module.scss"
import useSocket from '../../src/useSocket'
import { useState } from "react";

const socket = io();
let thedata = [{
    position: 0.5,
    color: 'red',
},{
    position: 0.1,
    color: 'yellow',
}]
let thedata2 = [{
    position: 0.7,
    color: 'red',
},{
    position: 0.4,
    color: 'green',
}]

let thedata3 = [{
    position: 1,
    color: 'red',
},{
    position: 0.6,
    color: 'yellow',
},{
    position: 0.8,
    color: 'green',
}]

let thedata4 = [{
    position: 1,
    color: 'red',
},{
    position: 1,
    color: 'yellow',
},{
    position: 1,
    color: 'green',
}]

export default function control() {
    useSocket(socket);

    const [ManualOnly, setManualOnly] = useState(false);

    return (
        <>
            <div>
                <text> {ManualOnly === true && "You are in manual start mode.\n"} </text>
                <text> {ManualOnly === false && "You are in automatic start mode.\n"} </text>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('start')
                }}>start</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('reset')
                }}>reset</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('stop')
                }}>stop early</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('togglemanual')
                    setManualOnly(!ManualOnly)
                }}>Toggle Mode</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('pos_update', thedata)
                }}>Datatest1</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('pos_update', thedata2)
                }}>Datatest2</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('pos_update', thedata3)
                }}>Datatest3</button>
            </div>
            <div className={styles.container}>
                <button className={styles.button} onClick={() => {
                    socket.emit('pos_update', thedata4)
                }}>Datatest4</button>
            </div>
        </>
    )
}




