import Head from 'next/head';
import Classes from './scoreboard.module.scss';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

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

export default function Scoreboard(props) {

    const [raceState, setRaceState] = useState('RUNNING');
    const [progressBars, setProgressBars] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        async function doShit() { 
            // implement socket
            await fetch('/api/socket');
            const socket = io();

            // print when connected
            socket.on('connect', () => {
                console.log('Sockets connected to server');
            });

            // print when disconnected
            socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });
        }

        doShit();
    }, []);

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
                        <div className={Classes.stateTimer}>0:13</div>
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