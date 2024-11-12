import { forwardRef, useEffect, useState } from 'react';
import { Button, Label, Form, Input } from "reactstrap";
import { IoIosSearch } from "react-icons/io";
import JugadorView from './JugadorView';
import JugadorList from "./JugadorList";
import { VscChromeClose } from "react-icons/vsc";
import { IoCloseCircle } from "react-icons/io5";
import tokenService from 'frontend/src/services/token.service.js';
import useFetchState from "frontend/src/util/useFetchState.js";

const GetFriendsModal = forwardRef((props, ref) => {
    const [player, setPlayer] = useState(null);
    const [userName, setUsername] = useState("");
    const user = tokenService.getUser();
    const jwt = tokenService.getLocalAccessToken();

    const [message, setMessage] = useState(null);
    const [visible, setVisible] = useState(false);
    const [amigos, setAmigos] = useState([]);

    useEffect(() => {
            if (!userName) {
                fetch(
                    `/api/v1/jugador/amigos?userId=` + user.id,
                    {
                        method: "GET"
                    }
                )
                    .then((response) => response.text())
                    .then((data) => {
                        setAmigos(JSON.parse(data))

                    })
                //.catch((message) => alert(message));
            }


    })


    function handleSubmit(event) {
        setPlayer(null)

        event.preventDefault();
        fetch(
            "/api/v1/jugador/" + userName,
            {
                method: "GET"
            }
        )
            .then((response) => response.text())
            .then((data) => {

                if (data.includes('"statusCode":40')) {
                    alert('Jugador ' + userName + ' no encontrado')
                } else {
                    setPlayer(JSON.parse(data))
                }
            })
            .catch((message) => alert(message + userName));
    }

    function handleChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        setUsername(value)
    }

    function handleReset() {
        setPlayer(null);
        document.getElementById('inputId').value = '';
        fetch(
            `/api/v1/jugador/amigos?userId=` + user.id,
            {
                method: "GET"
            }
        )
            .then((response) => response.text())
            .then((data) => {
                setAmigos(JSON.parse(data))

            })
        //.catch((message) => alert(message));
    }
    function handleModalVisible(setModalVisible, modalVisible) {
        setModalVisible(!modalVisible);
    }


    return (
        <div style={{ backgroundImage: 'url(/fondos/fondoAmigosModal3.png)', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', height: '100%', width: '100%' }}>
            <IoCloseCircle style={{ width: 30, height: 30, cursor: "pointer", position: 'absolute', textAlign: 'left' }} onClick={() => handleModalVisible(props.setModalVisible, props.modalVisible)} />
            <h1 style={{ fontSize: 30, textAlign: 'center' }}>
                Chats
            </h1>
            <hr></hr>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input onChange={handleChange} style={{ color: "black" }} id='inputId' placeholder="Buscar..." class="input" name="text" type="text" required />
                        <div>
                            <button style={{ background: 'transparent', border: 'transparent' }}>
                                <IoIosSearch style={{ width: 40, height: 40, cursor: 'pointer' }} />

                            </button>
                            {player &&
                                <VscChromeClose style={{ width: 40, height: 40, cursor: "pointer", position: 'absolute', marginLeft: 20 }} onClick={() => handleReset()} />
                            }
                        </div>
                    </div>
                </Form>
            </div>
            {player &&
                <JugadorView jugador={player} />}
                {!player &&
                    <div>
                        <JugadorList jugadores={amigos} />
                    </div>
                }


            </div>






    )







}
)
export default GetFriendsModal;
