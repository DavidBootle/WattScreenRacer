import Head from 'next/head';
import Classes from './scoreboard.module.scss';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import useSocket from '../../src/useSocket';

import { useStopwatch } from 'react-timer-hook';

function ProgressBar({name, progress, color, completed}) {
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
    const [winnerTime, setWinnerTime] = useState('');

    const {
        seconds,
        minutes,
        start,
        pause,
        reset,
      } = useStopwatch({ autoStart: true });

    useSocket(socket);

    useEffect(() => {
        // manage sockets
        socket.on('score_update', (data) => {
            console.log('SCORE UPDATE');
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
            console.log('RACE STARTING');
            setRaceState('RUNNING');
            start();
        });

        socket.on('race_stop', () => {
            setRaceState('WAITING');
            pause();
        })

        socket.on('race_finished', (id) => {
            setRaceState('FINISHED');
            setWinner(id);
            pause();
        })

        socket.on('race_reset', () => {
            setRaceState('WAITING');
            pause();
            reset();
            setPlayers({});
            setWinner(null);
            setWinnerTime('');
        });

        socket.on('player_finish', (id) => {
            if (!winner) {
                setWinner(id);
                setWinnerTime(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
            }
        });
    });
    

    const progressBars = Object.values(players).map((player) => {
        console.log(player);
        return (
            <ProgressBar key={player.id} name={player.name} progress={player.position * 100} color={player.color} />
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
                        <div className={Classes.stateText}>RACE COMPLETE</div>
                    }
                </div>
                <div className={Classes.rightColumn}>
                    { raceState === 'WAITING' &&
                        <div className={Classes.paragraphText}>{"Hey there, CUHackit! Stick around! We'll be starting again soon!"}</div>
                    }
                    { raceState === 'RUNNING' && progressBars }

                    { raceState === 'FINISHED' &&
                        <div className={Classes.winnerText} style={{color: players[winner]?.color}}>{players[winner]?.name?.toUpperCase()} wins with a time of {winnerTime}!</div>
                    }
                </div>
            </div>
        </div>
    )
}