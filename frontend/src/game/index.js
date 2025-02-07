import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import tokenService from "../services/token.service.js";
import WaitingModal from "../game/WaitingModal.js";
import PlayingModal from "../manos/PlayingModal.js";
import FinishedModal from "./FinishedModal";
import MessageList from "../components/MessageList.js";
import InputContainer from "../components/InputContainer.js";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import shuiDef from '../static/audios/shuiDef.mp3';
import shiuDef from '../static/audios/shiuDef.mp3';

const jwt = tokenService.getLocalAccessToken();

export default function Game() {
    const currentUrl = window.location.href;
    const codigo = currentUrl.split("partidaCode=")[1].substring(0, 5);
    const [game, setGame] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const stompClientRef = useRef(null);
    const isConnectedRef = useRef(false);
    const [chatView, setChatView] = useState(false);
    const navigate = useNavigate();

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");

    
    const handleErrorAndRedirect = (errorMessage) => {
        setMessage(errorMessage);
        setVisible(true);
        setTimeout(() => {
            navigate("/home"); 
        }, 3000);
    };

    useEffect(() => {
        let intervalId;

        async function fetchGame() {
            try {
                const response = await fetch(
                    `https://trucobeasts-e0dxg3dvccd5dvb5.centralus-01.azurewebsites.net/api/v1/partida/search?codigo=${codigo}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${jwt}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        handleErrorAndRedirect("Partida no encontrada, redirigiendo...");
                    } else {
                        throw new Error("Error en la respuesta del servidor.");
                    }
                } else {
                    const data = await response.json();
                    setGame(data);

                    if (data.estado === "FINISHED") {
                        clearInterval(intervalId); 
                    }
                }
            } catch (error) {
                console.error("Error fetching partida:", error);
                if (!visible) {
                    setMessage("Error al obtener los datos de la partida.");
                    setVisible(true);
                }
            }
        }

         fetchGame();
        intervalId = setInterval(fetchGame, 1000);

        return () => clearInterval(intervalId); 
    }, [codigo, navigate]);

    useEffect(() => {
        if (!isConnectedRef.current) {
            connectToChat();
        }

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                isConnectedRef.current = false;
            }
        };
    }, []);

    function connectToChat() {
        if (isConnectedRef.current) {
            console.warn("Ya existe una conexión activa al servidor STOMP.");
            return;
        }

        const cliente = new Client({
            brokerURL: "ws://trucobeasts-e0dxg3dvccd5dvb5.centralus-01.azurewebsites.net/ws",
            connectHeaders: {
                Authorization: `Bearer ${jwt}`,
            },
        });

        cliente.onConnect = () => {
            console.log("Conectado exitosamente al chat de partida " + codigo);
            isConnectedRef.current = true;

            cliente.subscribe(`/topic/gamechat/${codigo}`, (mensaje) => {
                console.log("Mensaje recibido: ", mensaje.body);
                const nuevoMensaje = JSON.parse(mensaje.body);
                setMensajes((prevMensajes) => [...prevMensajes, nuevoMensaje]);
            });
        };

        cliente.onDisconnect = () => {
            console.log("Desconectado del servidor STOMP");
            isConnectedRef.current = false;
        };

        cliente.onStompError = (frame) => {
            console.error("Error de STOMP: ", frame.headers["message"]);
            console.error("Detalles: ", frame.body);
        };

        cliente.activate();
        stompClientRef.current = cliente;
    }

    const evtEnviarMensaje = () => {
        const cliente = stompClientRef.current;

        if (cliente && cliente.connected && mensaje.trim() !== "") {
            cliente.publish({
                destination: "/app/mensajepartida",
                body: JSON.stringify({
                    contenido: mensaje,
                    chat: {
                        id: game.id,
                        partida: { id: game.id, codigo: codigo },
                    },
                    remitente: {
                        id: tokenService.getUser().id,
                        username: tokenService.getUser().username,
                        lastConnection: new Date(),
                    },
                    fechaEnvio:new Date(),
                }),
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });
            console.log("Mensaje enviado");
            setMensaje("");
        } else {
            console.error("STOMP aún no está listo o no está conectado");
        }
    };
    const playEntrySound = () => {
        const audio = new Audio(shuiDef); // path to your audio file
        audio.play().catch(err => console.error("Audio play error:", err));
      };
      const playExitSound = () => {
        const audio = new Audio(shiuDef); // path to your audio file
        audio.play().catch(err => console.error("Audio play error:", err));
      };
    return (
        <div>
            {game && game.estado === "WAITING" && <WaitingModal game={game} />}
            {game && game.estado === "ACTIVE" && <PlayingModal game={game} />}
            {game && game.estado === "FINISHED" && <FinishedModal game={game} />}
            {game && game.estado !== "FINISHED" && (
                <>
                    <IoChatboxEllipsesOutline
                        style={{
                            position: 'fixed',
                            bottom: '20%',
                            right: '20px',
                            zIndex: 998,
                            color: 'yellow',
                            cursor: 'pointer',
                            fontSize: '48px',
                        }}
                        onClick={() => setChatView(!chatView)}
                    />

                      <CSSTransition
                                in={chatView}               // controls when it is shown
                                timeout={300}                  // duration in ms (adjust as needed)
                                classNames="slide-right"       // base name for our CSS classes
                                unmountOnExit   
                                onEntered={playEntrySound}
                                onExited={playExitSound}       // play sound when done exiting
                                // This plays the sound once the modal has fully entered
                                // unmount the modal once hidden
                                >
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            height: '100%',
                            width: '35%',
                            backgroundColor: 'white',
                            backgroundImage: 'url(/fondos/fondoAmigosModal.png)',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            boxShadow: '-2px 0 5px rgba(0,0,0,0.5)',
                            zIndex: 15232300,
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <IoCloseCircle
                                style={{
                                    cursor: 'pointer',
                                    fontSize: '30px',
                                    position: 'absolute',
                                    top: '12px',
                                    left: '10px',
                                    color: "rgb(123, 27, 0)"
                                }}
                                onClick={() => setChatView(!chatView)} />
                            <h1 className="loginText" style={{ textAlign: 'center',fontSize:'40px', marginTop:'10px' }}>Chat de la partida</h1>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <MessageList mensajes={mensajes} userId={tokenService.getUser().id} />
                            </div>
                            <div style={{ position: 'sticky', bottom: 0 }}>
                                <InputContainer
                                    mensaje={mensaje}
                                    setMensaje={setMensaje}
                                    evtEnviarMensaje={evtEnviarMensaje}
                                />
                            </div>
                        </div>
                </CSSTransition>
                </>
            )}
                    </div>
    );
}
