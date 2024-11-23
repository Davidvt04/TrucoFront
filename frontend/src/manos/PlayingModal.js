import { useState, forwardRef, useEffect } from 'react';
import tokenService from "frontend/src/services/token.service.js";
import useFetchState from "../util/useFetchState";

const jwt = tokenService.getLocalAccessToken();

const PlayingModal = forwardRef((props, ref) => {
    const game = props.game
    const [message, setMessage] = useState(null);
    const [visible, setVisible] = useState(false);
    const [cartasJugador,setCartasJugador] = useState([])
    const [mano, setMano] = useState(null)

    const [posicion, setPosicion] = useFetchState(
        {}, `/api/v1/partidajugador/miposicion/${game.id}`, jwt, setMessage, setVisible
      );
     function fetchMano() {
            
        fetch(
            '/api/v1/manos/'+game.codigo,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                  },
            }
        )
            .then((response) => response.json())
            .then((data) => {
                setMano(data);
                setCartasJugador(data.cartasDisp[Number(posicion)])
            })
    }
    
    useEffect(() => {
        let intervalId;

        
        fetchMano();

        intervalId = setInterval(fetchMano, 1000);
        
        return () => clearInterval(intervalId)
    },[game.codigo])

    const renderCartasJugador = () => {
        if (mano && mano.cartasDisp && posicion !== null) {
            const cartasJugador = mano.cartasDisp[posicion]; 

            if (!cartasJugador) {
                return <div>No hay cartas para mostrar.</div>;
            }
           
    
          

            
            return cartasJugador.map((carta, index) => (
                <img
                    key={index}
                    src={carta.foto} 
                    alt={`Carta ${index + 1}`}
                    style={{ width: '50px', height: '75px', margin: '5px' }} 
                    onError={(e) => (e.target.style.display = 'none')} 
                />
            ));
        }

        return <div>Cargando cartas...</div>;
    };
    const renderCartasMesa = () => {
        if (mano && mano.cartasLanzadasRonda) {
            const cartasLanzadas = mano.cartasLanzadasRonda; 

            if (!cartasLanzadas) {
                return <div>No hay cartas para mostrar.</div>;
            }

            
            return cartasLanzadas.map((carta, index) => (<>
                {carta &&
                    <img
                    key={index}
                    src={carta.foto} 
                    alt={`Carta ${index + 1}`}
                    style={{ width: '50px', height: '75px', margin: '5px' }} 
                    onError={(e) => (e.target.style.display = 'none')} 
                />
                }
                </>
                
            ));
        }

        return <div>Cargando cartas lanzadas...</div>;
    };


     function tirarCarta(cartaId) {
        
            fetch(`/api/v1/manos/${game.codigo}/tirarCarta/${cartaId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }).then((response) => response.text())
            .then((data) => {
                if(data){
                    console.log(data)
                }
            })
            .catch((error) => alert(error.message));

          
    }

    return (<>
            <div>
                <h3>Cartas del Jugador {Number(posicion)}</h3>
                {renderCartasJugador()} 
            </div>
            <div style={{left: "20px", position: "absolute"}}>
                {renderCartasMesa()}
            </div>
            {mano && posicion === mano.jugadorTurno &&
            <div style={{ width: '150px', height: '75px', margin: '5px', left: "20px", position: "absolute", top: "200px"}}> 
                {cartasJugador[0] && <button onClick={()=> tirarCarta(0)} >Tirar {cartasJugador[0].valor} de {cartasJugador[0].palo}</button>}
                {cartasJugador[1] && <button onClick={()=> tirarCarta(1)} > Tirar {cartasJugador[1].valor} de {cartasJugador[1].palo}</button>}
                {cartasJugador[2] && <button onClick={()=> tirarCarta(2)} >Tirar {cartasJugador[2].valor} de {cartasJugador[2].palo}</button>}
            </div>}
        {mano && console.log(mano)}
        </>
    )
        
    

});
export default PlayingModal;