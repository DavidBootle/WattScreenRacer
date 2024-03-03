import io from "socket.io-client"
import styles from "./control.module.scss"
import useSocket from '../../src/useSocket'
import { useState } from "react";

const socket = io();


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
        </>
    )
}




