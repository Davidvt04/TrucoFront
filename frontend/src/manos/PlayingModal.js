import React, { useState, forwardRef, useEffect, useRef } from 'react';
import tokenService from "frontend/src/services/token.service.js";
import useFetchState from "../util/useFetchState";
import CartasVolteadas from './CartasVolteadas';
import './PlayingModal.css';


import backgroundMusic from 'frontend/src/static/audios/musicaPartida2.mp3';
import PuntosComponente from './PuntosComponente';

const jwt = tokenService.getLocalAccessToken();


const PlayingModal = forwardRef((props, ref) => {
    const game = props.game;
    const [message, setMessage] = useState(null);
    const [visible, setVisible] = useState(false);
    const [cartasJugador, setCartasJugador] = useState([]);
    const [mano, setMano] = useState(null);



    const puntosSinTruco = 1;
    const puntosConTruco = 2;
    const puntosConRetruco = 3;
    const [puntosTrucoActuales, setPuntosTrucoActuales] = useState(puntosSinTruco);
    const [tirarTrigger, setTirarTrigger] = useState(0);
    const [trucoTrigger, setTrucoTrigger] = useState(0);
    const [envidoTrigger, setEnvidoTrigger] = useState(0);
    const [posicion, setPosicion] = useFetchState(
        {}, `/api/v1/partidajugador/miposicion/${game.id}`, jwt, setMessage, setVisible
    );

    const audioRef = useRef(null);
    const dropAreaRef = useRef(null);
    const [isOverDropArea, setIsOverDropArea] = useState(false);
    const [draggedCarta, setDraggedCarta] = useState(null);
    const [positionCarta, setPositionCarta] = useState({ x: 0, y: 0 });

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50); // Default volume at 50%



    function fetchMano() {
        fetch('/api/v1/manos/' + game.codigo, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })
        .then((response) => response.json())
        .then((data) => {
            setMano(data);
            let cartasActuales = data.cartasDisp[posicion];
        
            if (cartasJugador !== cartasActuales) {
                setCartasJugador(cartasActuales);
                setPuntosTrucoActuales(data.puntosTruco);
 
                
            }          

        })
        .catch((error) => {
            console.error("Error fetching mano:", error);
            setMessage("Error fetching mano.");
            setVisible(true);
        });
    }

    useEffect(() => {
        let intervalId;
        fetchMano();
        intervalId = setInterval(fetchMano, 1000);
        return () => clearInterval(intervalId);
    }, [game.codigo, posicion]);

    useEffect(() => {
        fetchMano();
    }, [tirarTrigger, trucoTrigger, envidoTrigger]);

    useEffect(() => {
        if (mano && puntosTrucoActuales) {
            setPuntosTrucoActuales(mano.puntosTruco);
        }
    }, [mano]);

    // Set initial volume when component mounts or volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const handlePlayMusic = () => {
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((error) => {
                    console.error("Error playing audio:", error);
                });
        }
    };

    const handlePauseMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };


    const handleVolumeChange = (event) => {
        const sliderValue = event.target.value;
    
        
        const minLog = 0.01; // Volumen más bajo (casi mudo)
        const maxLog = 1;    // Volumen más alto (máximo)
        
        
        const logVolume = Math.pow(10, (sliderValue / 100) * (Math.log10(maxLog) - Math.log10(minLog)) + Math.log10(minLog));
    
        setVolume(sliderValue); 
        if (audioRef.current) {
            audioRef.current.volume = logVolume; 
        }
    };

    const renderCartasJugador = () => {
        if (mano && mano.cartasDisp && posicion !== null) {
            const cartasJugador = mano.cartasDisp[posicion];
            const esTurnoValido =
                mano &&
                cartasJugador &&
                Number(posicion) === mano.jugadorTurno &&
                !mano.esperandoRespuesta;

            if (!cartasJugador) {
                return <div>No hay cartas para mostrar.</div>;
            }

            return (
                <div className="cartas-jugador-container">
                    {cartasJugador.map((carta, index) => (
                        carta && (
                            <div
                                key={index}
                                className={`card-container ${esTurnoValido ? 'swirl' : ''}`}
                            >
                                <div
                                    className={`base-card ${!esTurnoValido ? 'invalid-turn' : ''}`}
                                    draggable={esTurnoValido}
                                    onDragStart={(evento) => dragStart(evento, carta)}
                                    onDrag={(evento) => onDrag(evento)}
                                    onDragEnd={(evento) => onDragEnd(evento, carta)}
                                >
                                    <img
                                        src={carta.foto}
                                        alt={`Carta ${index + 1}`}
                                        className="card-image"
                                        onError={(e) => (e.target.style.display = 'none')}
                                    />
                                    {/* Overlay de resplandor holográfico */}
                                    <div className="sunset-overlay"></div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            );
        }

        return <div>Cargando cartas...</div>;
    };

    const renderCartasMesa = () => {
        if (mano && mano.cartasLanzadasRonda) {
            const cartasLanzadas = mano.cartasLanzadasRonda;

            if (!cartasLanzadas || cartasLanzadas.length === 0) {
                return <div>No hay cartas para mostrar.</div>;
            }

            return (
                <div className="cartas-mesa-container">
                    {cartasLanzadas.map((carta, index) => (
                        carta && (
                            <div key={index} className="card-container mesa">
                                <img
                                    src={carta.foto}
                                    alt={`Carta ${index + 1}`}
                                    className="card-image"
                                    onError={(e) => (e.target.style.display = 'none')}
                                />
                                <div className="sunset-overlay"></div>
                            </div>
                        )
                    ))}
                </div>
            );
        }
        
        return <div>Cargando cartas lanzadas...</div>;
    };

    const dragStart = (evento, carta) => {
        if (mano && cartasJugador && Number(posicion) === mano.jugadorTurno) {
            setDraggedCarta(carta);
            evento.dataTransfer.effectAllowed = 'move';
        }
    };

    const onDrag = (evento) => { 
        const x = evento.clientX;
        const y = evento.clientY;
        setPositionCarta({ x, y });

        if (dropAreaRef.current) {
            const dropAreaRect = dropAreaRef.current.getBoundingClientRect();
            const isOver = (
                x >= dropAreaRect.left &&
                x <= dropAreaRect.right &&
                y >= dropAreaRect.top &&
                y <= dropAreaRect.bottom
            );
            setIsOverDropArea(isOver);
        }
    };

    const onDragEnd = (evento, carta) => { 
        const x = evento.clientX;
        const y = evento.clientY;
    
        if (dropAreaRef.current) {
            const dropAreaRect = dropAreaRef.current.getBoundingClientRect();
            const isOver = (
                x >= dropAreaRect.left &&
                x <= dropAreaRect.right &&
                y >= dropAreaRect.top &&
                y <= dropAreaRect.bottom
            );
    
            if (isOver) {
                tirarCarta(carta.id); 
            }
        }
    
        setDraggedCarta(null);  
        setIsOverDropArea(false);
    };

    function tirarCarta(cartaId) {
        fetch(`/api/v1/manos/${game.codigo}/tirarCarta/${cartaId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.text())
        .then((data) => {
            if (data) {
                setTirarTrigger((prev) => prev + 1);
            }
        })
        .catch((error) => alert(error.message));
    }

    function cantarTruco(truco) {
        fetch(`/api/v1/manos/${game.codigo}/cantarTruco/${truco}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.text())
        .then((data) => {
            if (data) {
                setTrucoTrigger((prev) => prev + 1);
            }
        })
        .catch((error) => alert(error.message));
    }

    function responderTruco(respuesta) {
        fetch(`/api/v1/manos/${game.codigo}/responderTruco/${respuesta}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.text())
        .then((data) => {
            if (data) {
                setTrucoTrigger((prev) => prev + 1);
            }
        })
        .catch((error) => alert(error.message));
    }

    function cantarEnvido(respuesta) {
        fetch(`/api/v1/manos/${game.codigo}/cantarEnvido/${respuesta}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.text())
        .then((data) => {
            if (data) {
                setEnvidoTrigger((prev) => prev + 1);
            }
        })
        .catch((error) => alert(error.message));
    }
    function responderEnvido(respuesta) {
        fetch(`/api/v1/manos/${game.codigo}/responderEnvido/${respuesta}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.text())
        .then((data) => {
            if (data) {
                setEnvidoTrigger((prev) => prev + 1);
            }
        })
        .catch((error) => alert(error.message));
    }

    return (
        <>
            {console.log(mano)}
            {/* Background */}
            <div
                style={{ 
                    backgroundImage: 'url(/fondos/fondoPlayingModal.jpg)',
                    backgroundSize: 'cover', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'center', 
                    height: '100vh', 
                    width: '100vw',
                    position: 'relative', // To position the dragged card relative to this container
                    zIndex: -1
                }}
            >
                <h3 className="player-heading">
                    Jugador: {Number(posicion)}
                </h3>
                
            </div>
            <h4 className={"puntos-nuestros"}>Nos:</h4>
            <h4 className={"puntos-ellos"}>Ellos:</h4>
            {mano &&  puntosTrucoActuales &&
            (
                <> 
                <PuntosComponente  estiloFotoPunto={"puntaje-EquipoNuestro"} 
                                    posicion={posicion} puntosEquipo1={game.puntosEquipo1} puntosEquipo2={game.puntosEquipo2}
                                    />
               
                <PuntosComponente estiloFotoPunto={"puntaje-EquipoEllos"} 
                                    posicion={posicion} puntosEquipo1={game.puntosEquipo2} puntosEquipo2={game.puntosEquipo1}
                                />
                </>
            )}
                
            {/* Drop Area */}
            <div
                ref={dropAreaRef}
                className={`drop-area`}
            >
                {/* Visual indicator for drop area (optional) */}
            </div>

            {/* Play Music Button */}
            {!isPlaying && (
                <button onClick={handlePlayMusic} className="play-music-button">
                     <span className="swirl-glow-text"> 🎵
                     </span>                 
                </button>
            )}

            {/* Volume Slider */}
            {isPlaying && (
                    <>
                        <button onClick={handlePauseMusic} className="play-music-button">
                        ⏸
                        </button>
                        <div className="volume-slider-container">
                            <label htmlFor="volume-slider">Volume:</label>
                            <input
                                type="range"
                                id="volume-slider"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange}
                            />
                            <span>{volume}%</span>
                        </div>
                    </>
                )}
            

          
            <audio ref={audioRef} src={backgroundMusic} loop /> 

            {/* Player's Cards */}
            {renderCartasJugador()}

            {/* Render the Dragged Card */}
            {draggedCarta && (
                <div
                    className={`dragged-card ${Number(posicion) === mano.jugadorTurno ? 'swirl' : ''}`}
                    style={{ 
                        left: `${positionCarta.x - 50}px`,  // Subtract half the card's width
                        top: `${positionCarta.y - 75}px`,   // Subtract half the card's height
                        opacity: isOverDropArea ? 1 : 0.5,
                        pointerEvents: 'none',
                        position: 'fixed', // Use fixed position
                        zIndex: 1000
                    }}
                >
                    <img
                        src={draggedCarta.foto}
                        alt="Carta arrastrada"
                        className="card-image"
                        onError={(e) => (e.target.style.display = 'none')}
                    />
                    {/* Holographic glow overlay */}
                    <div className="sunset-overlay"></div>
                </div>
            )}

            {/* Table Cards */}
            <div className="cartas-mesa-position">
                {renderCartasMesa()}
            </div>

            {/* Truco Buttons */}
            <div style={{display:'flex', flexDirection: 'row'}}>
            {mano && cartasJugador && Number(posicion) === mano.jugadorTurno && !mano.esperandoRespuesta && mano.puedeCantarTruco && puntosTrucoActuales && (
                <div className="truco-button-container"> 
                    {puntosTrucoActuales === puntosSinTruco && (
                        <button onClick={() => cantarTruco('TRUCO')}>
                            <span className="swirl-glow-text">¡Truco!</span>
                        </button>
                    )}
                    {puntosTrucoActuales === puntosConTruco && (
                        <button onClick={() => cantarTruco('RETRUCO')}>
                            <span className="swirl-glow-text">¡Retruco!</span>
                        </button>
                    )}
                    {puntosTrucoActuales === puntosConRetruco && (
                        <button onClick={() => cantarTruco('VALECUATRO')}>
                            <span className="swirl-glow-text">¡Vale cuatro!</span>
                        </button>
                    )}
                </div>
            )}
            {/* Cantar envido */}
            {mano && cartasJugador && Number(posicion) === mano.jugadorTurno && !mano.esperandoRespuesta && mano.puedeCantarEnvido && (
                <div className="truco-button-container" > 
                    {mano.queEnvidoPuedeCantar > 1 && (
                        <button onClick={() => cantarEnvido('ENVIDO')}>
                            <span className="swirl-glow-text">Envido</span>
                        </button>
                    )}
                    {mano.queEnvidoPuedeCantar >=1 && (
                        <button onClick={() => cantarEnvido('REAL_ENVIDO')}>
                            <span className="swirl-glow-text">Real Envido</span>
                        </button>
                    )}
                    {mano.queEnvidoPuedeCantar > 0 && (
                        <button onClick={() => cantarEnvido('FALTA_ENVIDO')}>
                            <span className="swirl-glow-text">Falta Envido</span>
                        </button>
                    )}
                </div>
            )}
            </div>
            {/* Responder Truco Buttons */}
            {mano && cartasJugador && Number(posicion) === mano.jugadorTurno && mano.esperandoRespuesta && puntosTrucoActuales && (
                <div className="truco-button-container responder-truco-buttons"> 
                    {puntosTrucoActuales !== puntosConRetruco && 
                        <button onClick={() => responderTruco("QUIERO")}>Quiero</button>}
                    <button onClick={() => responderTruco("NO_QUIERO")}>No quiero</button>
                    {puntosTrucoActuales === puntosConRetruco && 
                        <button style={{ animation: 'dropShadowGlowContainer 3s ease-in-out infinite' }} 
                            onClick={() => responderTruco("QUIERO")}>
                            <span className="swirl-glow-text"> ¡Quiero!</span>
                        </button>}
    
                    {puntosTrucoActuales !== puntosConRetruco && mano.puedeCantarTruco && 
                        <button
                            style={{ animation: 'dropShadowGlowContainer 3s ease-in-out infinite' }}
                            onClick={() => responderTruco('SUBIR')}
                        >
                            <span className="swirl-glow-text">
                                {puntosTrucoActuales === puntosSinTruco ? '¡Retruco!' : '¡Vale Cuatro!'}
                            </span>
                        </button>}
                </div>
            )}
            
        {/*Responder envido */}
        {mano && cartasJugador && Number(posicion) === mano.jugadorTurno && mano.esperandoRespuesta && (
                <div className="truco-button-container responder-truco-buttons"> 
                    
                        <button onClick={() => responderEnvido("QUIERO")}>Quiero</button>
                        <button onClick={() => responderEnvido("NO_QUIERO")}>No quiero</button>
                    
                    
                        {mano.queEnvidoPuedeCantar > 1 &&mano.puedeCantarEnvido && (
                        <button onClick={() => responderEnvido('ENVIDO')}>
                            <span className="swirl-glow-text">Envido</span>
                        </button>
                    )}
                    {mano.queEnvidoPuedeCantar >1 && mano.puedeCantarEnvido &&(
                        <button onClick={() => responderEnvido('REAL_ENVIDO')}>
                            <span className="swirl-glow-text">Real Envido</span>
                        </button>
                    )}
                    {mano.queEnvidoPuedeCantar > 0 &&mano.puedeCantarEnvido && (
                        <button onClick={() => responderEnvido('FALTA_ENVIDO')}>
                            <span className="swirl-glow-text">Falta Envido</span>
                        </button>
                    )}
                </div>
            )}
            {/* Cartas Volteadas */}
            {mano && (
                <CartasVolteadas
                    cartasDispo={mano.cartasDisp}
                    posicionListaCartas={posicion}
                    jugadorMano={game.jugadorMano}
                />
            )}
        
                
        </>
    );
});

    export default PlayingModal;
