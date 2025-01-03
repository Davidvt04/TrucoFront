import React, { forwardRef, useState, useEffect, useRef, useLayoutEffect } from "react";
import tokenService from "../services/token.service";
import useFetchState from "../util/useFetchState";
import { Client } from "@stomp/stompjs";
import "./Chat.css";
import RenderContent from "./RenderContent";

const Chat = forwardRef((props, ref) => {
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);


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
  const messagesContainerRef = useRef(null);

  // Efecto para desplazar automáticamente al final cuando los mensajes cambien
  function moveScroll() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  useEffect(() => {
    fetch(`/api/v1/chat/users/${props.idChat}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((response) => response.json())
      .then((users) => {
        const otherUser = users.find((u) => u.id !== user.id);
        setChatUser(otherUser);
      })
      .catch((error) => console.error("Error al obtener los usuarios del chat:", error));
  }, [props.idChat, jwt, user.id]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      moveScroll();
    });

    if (messagesContainerRef.current) {
      observer.observe(messagesContainerRef.current, { childList: true, subtree: true });
    }

    return () => {
      if (messagesContainerRef.current) {
        observer.disconnect();
      }
    };
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
          remitente: { id: tokenService.getUser().id, username: tokenService.getUser().username },
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
  const handleRemoveFriend = (friendId) => {
    fetch(`/api/v1/jugador/isFriend/${friendId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo eliminar al amigo.");
        }
        alert("Amigo eliminado exitosamente.");
      })
      .catch((error) => {
        console.error(error);
        alert("Hubo un problema al eliminar al amigo.");
      });
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
    <h1 style={{ fontSize: 30, textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
      {chatUser ? chatUser.username : "Cargando..."}
      {chatUser && (
        <button
          style={{
            background: "#ff4d4f",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onClick={() => setShowConfirmModal(true)}
        >
          Eliminar Amigo
        </button>
      )}
    </h1>
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
        ref={messagesContainerRef}
      >
        {mensajes.map((msg, i) => {
          return (
            msg.remitente.id === user.id ? (
              <div key={i} className="own-message">
                <RenderContent contenido={msg.contenido} />
                <p style={{fontSize:10 ,color:'gray'}}>{formatFecha(msg.fechaEnvio)}</p>
              </div>
            ) : (
              <>
                <div key={i}>{msg.remitente.username}</div>
                <div key={i} className="other-message">
                  <RenderContent contenido={msg.contenido} />
                  <p style={{fontSize:10 ,color:'gray'}}>{formatFecha(msg.fechaEnvio)}</p>
                </div>
              </>
            )
          );
        }
        )}
        <div ref={messagesEndRef} />


      </div>

      <div className="input-container">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="input-text"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleEnviar();
            }
          }}
        />
        <button onClick={handleEnviar} className="btn-send">
          Enviar
        </button>
      </div>
    </div>
    {showConfirmModal && (
  <div
    style={{
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <p>¿Estás seguro de que quieres eliminar este amigo?</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        <button
          onClick={() => {
            handleRemoveFriend(chatUser.id);
            setShowConfirmModal(false);
          }}
          style={{
            background: "#ff4d4f",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Sí
        </button>
        <button
          onClick={() => setShowConfirmModal(false)}
          style={{
            background: "#ccc",
            color: "black",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
});

export default Chat;
