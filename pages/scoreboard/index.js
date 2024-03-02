import Head from 'next/head';
import Classes from './scoreboard.module.scss';

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

    return (
        <div className={Classes.container}>
            <div className={Classes.header}>
                <div className={Classes.title}>Never Skip Cardio</div>
                <div className={Classes.members}>David Bootle, Uzayr Syed, Kevin Cunningham, Nathan Goller-Deitsch</div>
            </div>
            <div className={Classes.body}>
                <div className={Classes.column}>
                    <div className={Classes.stateText}>WAITING</div>
                </div>
                <div className={Classes.column}>
                    <div className={Classes.progressBarContainer}>
                        <ProgressBar name="P1" color="#f53b02" progress={72}/>
                        <ProgressBar name="P2" color="#4cf5d6" progress={12}/>
                    </div>
                </div>
            </div>
        </div>
    )
}