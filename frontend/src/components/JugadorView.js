import { useState, forwardRef } from 'react';
import tokenService from '../services/token.service.js';
import { FaCircle } from "react-icons/fa";
const user = tokenService.getUser();
const jwt = tokenService.getLocalAccessToken();

const JugadorView = forwardRef((props, ref) => {
    const [jugador, setJugador] = useState(props.jugador)
    const [friendBool, setFriendBool] = useState(props.isFriend)
    const [solicitudBool, setSolicitudBool] = useState(props.isSolicitud)

    function handleSubmit() {
        fetch(
            "/api/v1/jugador/" + user.id + "/isSolicitado/" + jugador.id,
            {
                method: "PATCH"
            }
        )
            .then((response) => response.text())
            .then((data) => {
                if (JSON.parse(data).statusCode === 500) {
                    alert("No se puede mandar esa solicitud")
                } else {
                    setSolicitudBool(true);
                }


            })
            .catch((message) => alert(message));
    }

    /*
        useEffect(() => {
            if (friendBool !== true && solicitudBool) {
                fetch(
                    "/api/v1/jugador/" + user.id + "/isSolicitado/" + jugador.userName,
                    {
                        method: "GET"
                    }
                )
                    .then((response) => response.text())
                    .then((data) => {
                    
                        setSolicitudBool(JSON.parse(data))
                    })
                    .catch((message) => alert(message));
            }
        }, [friendBool, jugador.userName, props.isFriend,solicitudBool, props.isSolicitud]);*/

    return (
        <div 
            style={props.isSolicitud ? {} : { transition: 'background-color 0.3s ease, border 0.3s ease' }}
            onMouseEnter={(e) => {
                if (!props.isSolicitud) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.border = '2px solid lightbrown';
                }
            }}
            onMouseLeave={(e) => {
                if (!props.isSolicitud) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.border = 'none';
                }
            }}
        >
            <div style={{ cursor: 'pointer', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 5, position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <img style={{ height: 80, width: 80, borderRadius: 500 }} src={jugador.photo} alt='Foto de perfil del usuario'></img>
                        {(friendBool || props.interfaz==='partida') &&
                            <FaCircle style={{ color: jugador.isConnected ? 'green' : 'grey', fontSize: 20, position: 'absolute', bottom: 10, right: -5 }} />
                        }
                    </div>
                    <div style={{ display: '' }}>
                        <p style={{ marginLeft: 10, fontSize: 25, marginBottom: 0 }}>{jugador.firstName}</p>
                        <p style={{ marginLeft: 10, fontSize: 12, marginBottom: 0 }}>{jugador.userName}</p>

                        {friendBool && jugador.id !== user.id &&
                            <p style={{ marginLeft: 10, color: 'rgb(96,96,96)', whiteSpace: "nowrap" }}> Último mensaje </p>
                        }
                    </div>
                    {!friendBool && !solicitudBool && jugador.id !== user.id &&
                        <button class="button" style={{ margin: 10, color: 'darkgreen' }} onClick={() => handleSubmit()}>
                            Solicitud amistad
                        </button>
                    }
                </div>
            </div>
        </div>
    );
});

export default JugadorView;