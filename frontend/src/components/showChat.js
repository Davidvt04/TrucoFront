import React, { forwardRef, useState, useEffect, useRef } from "react";
import tokenService from "../services/token.service";
import useFetchState from "../util/useFetchState";
import { Client } from "@stomp/stompjs";
import "./Chat.css";

const Chat = forwardRef((props, ref) => {
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [mensajes, setMensajes] = useFetchState(
    [],
    `/api/v1/chat/${props.idChat}`,
    jwt,
    setMessage,
    setVisible
  );

  const [mensaje, setMensaje] = useState("");

  // Ref para el contenedor de mensajes
  const messagesEndRef = useRef(null);

  // Efecto para desplazar automáticamente al final cuando los mensajes cambien
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    const cliente = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    cliente.onConnect = () => {
      console.log("Conectado exitosamente");
      cliente.subscribe(`/topic/chat/${props.idChat}`, (mensaje) => {
        const nuevoMensaje = JSON.parse(mensaje.body);
        setMensajes((prevMensajes) => [...prevMensajes, nuevoMensaje]);
      });
    };

    cliente.onDisconnect = () => {
      console.log("Desconectado del servidor STOMP");
    };

    cliente.onStompError = (frame) => {
      console.error("Error de STOMP: ", frame.headers["message"]);
      console.error("Detalles: ", frame.body);
    };

    cliente.activate();
    setStompClient(cliente);

    return () => {
      if (cliente) {
        cliente.deactivate();
      }
    };
  }, [jwt, props.idChat]);

  const evtEnviarMensaje = () => {
    if (stompClient && stompClient.connected && mensaje.trim() !== "") {
      stompClient.publish({
        destination: "/app/mensaje",
        body: JSON.stringify({
          contenido: mensaje,
          chat: { id: props.idChat },
          remitente: { id: tokenService.getUser().id },
          username: { username: tokenService.getUser().username },
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

  const handleEnviar = () => {
    evtEnviarMensaje();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        height: "85vh",
      }}
    >
      <div
        className="messages-container"
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {mensajes.map((msg, i) =>
          msg.remitente.id === user.id ? (
            <div key={i} className="own-message">
              {msg.contenido}
            </div>
          ) : (
            <>
              <div key={i}>{msg.remitente.username}</div>
              <div key={i} className="other-message">
                {msg.contenido}
              </div>
            </>
          )
        )}

        {/* Ref hacia el final del contenedor de mensajes */}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="input-text"
        />
        <button onClick={handleEnviar} className="btn-send">
          Enviar
        </button>
      </div>
    </div>
  );
});

export default Chat;
