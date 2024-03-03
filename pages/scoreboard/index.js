import Head from 'next/head';
import Classes from './scoreboard.module.scss';
import { useState } from 'react';
import io from 'socket.io-client';
import useSocket from '../../src/useSocket';

import { useStopwatch } from 'react-timer-hook';

function ProgressBar({name, progress, color}) {
    return (
        <div className={Classes.progressBarContainer}>
            <div className={Classes.progressBarText}>{name}</div>
            <div className={Classes.progressBar}>
                <div className={Classes.progressBarFill} style={{width: `${progress}%`, backgroundColor: color}}></div>
            </div>
        </div>
    )
}

const socket = io();

export default function Scoreboard(props) {

    const [raceState, setRaceState] = useState('WAITING');
    const [players, setPlayers] = useState({});
    const [winner, setWinner] = useState(null);

    const {
        seconds,
        minutes,
        start,
        reset,
      } = useStopwatch({ autoStart: true });

    useSocket(socket);

    // manage sockets
    socket.on('score_update', (data) => {
        window.data = data;
        let newPlayers = {...players};
        data.forEach((value) => {
            if (players[value.id] === undefined) {
                newPlayers[value.id] = value;
            }
            newPlayers[value.id].position = value.position;
        });
        setPlayers(newPlayers);
    });

    socket.on('race_start', () => {
        setRaceState('RUNNING');
        start();
    });

    const progressBars = Object.values(players).map((player) => {
        console.log(player);
        return (
            <ProgressBar key={player.id} name={`Player ${player.id + 1}`} progress={player.position * 100} color={player.color} />
        )
    });

    return (
        <div className={Classes.container}>
            <div className={Classes.header}>
                <div className={Classes.title}>CU Run</div>
                <div className={Classes.members}>David Bootle<br/>Uzayr Syed<br/>Kevin Cunningham<br/>Nathan Goller-Deitsch</div>
            </div>
            <div className={Classes.body}>
                <div className={Classes.leftColumn}>
                    { raceState === 'WAITING' &&
                        <div className={Classes.stateText}>WAITING TO START</div>
                    }
                    { raceState === 'RUNNING' &&
                        <div className={Classes.stateTimer}>{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</div>
                    }
                    { raceState === 'FINISHED' &&
                        <div className={Classes.stateText}>FINISHED</div>
                    }
                </div>
                <div className={Classes.rightColumn}>
                    { raceState === 'WAITING' &&
                        <div className={Classes.paragraphText}>{"Hey there, CUHackit! Stick around! We'll be starting again soon!"}</div>
                    }
                    { raceState === 'RUNNING' && progressBars }

                    { raceState === 'FINISHED' &&
                        <div className={Classes.winnerText}>Player {winner} Wins!</div>
                    }
                    
                </div>
            </div>
        </div>
    )
}