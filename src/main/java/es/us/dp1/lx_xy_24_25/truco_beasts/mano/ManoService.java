package es.us.dp1.lx_xy_24_25.truco_beasts.mano;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.acls.model.NotFoundException;
import org.springframework.stereotype.Service;

import es.us.dp1.lx_xy_24_25.truco_beasts.carta.Carta;
import es.us.dp1.lx_xy_24_25.truco_beasts.carta.CartaRepository;
import es.us.dp1.lx_xy_24_25.truco_beasts.partida.Estado;
import es.us.dp1.lx_xy_24_25.truco_beasts.partida.Partida;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.CantosTruco;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.ConverterRespuestaTruco;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.ConverterTruco;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.RespuestaTruco;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.RespuestasTruco;
import es.us.dp1.lx_xy_24_25.truco_beasts.patronEstadoTruco.Truco;

@Service
public class ManoService {

    private final Map<String, Mano> manosPorPartida = new HashMap<>();

    private Mano manoActual;
    
    private final CartaRepository cartaRepository;
    private static ConverterTruco converterTruco;
    private static ConverterRespuestaTruco converterRespuestaTruco;
    

    @Autowired
    public ManoService(Mano mano, CartaRepository cartaRepository) {
        this.cartaRepository = cartaRepository;
        manoActual = mano;
    }

    public void setManoActual(String codigo){
        Mano nuevaMano = getMano(codigo);
        manoActual = nuevaMano;


    }
    public void actualizarMano(Mano mano, String codigo){
        Mano manoAnterior = manosPorPartida.get(codigo);
        if(manoAnterior != null){
            manosPorPartida.remove(codigo);
        }
        manosPorPartida.put(codigo, mano);
        manoActual = mano;
    }


    public Mano getMano(String codigo) throws IllegalArgumentException{
        Mano mano=  manosPorPartida.get(codigo);
        if(mano == null){
            throw new IllegalArgumentException("No hay una mano asociada a esa partida");
        }
        return mano;
    }
    
    
    public  Integer obtenerJugadorPie(){
        Integer pie = obtenerJugadorAnterior(manoActual.getPartida().getJugadorMano());
        return pie;
    }
                       
    public  Integer obtenerJugadorAnterior(Integer jugador) { 
        Integer numJugadores = manoActual.getPartida().getNumJugadores();
        return (jugador + numJugadores - 1) % numJugadores;
    }
        
    public  Integer siguienteJugador(Integer jugadorActual) {
        Integer siguiente = (jugadorActual + 1) % manoActual.getPartida().getNumJugadores();
        return siguiente;
    }
            
    public  void siguienteTurno(String codigo) {
        Mano manoActual = getMano(codigo); //TODO: seguro hay un patrón de diseño para no tener que hacer esto con todos los metodos.
            
        Integer jugadorActual = manoActual.getJugadorTurno();
        Integer siguiente = (jugadorActual + 1) % manoActual.getPartida().getNumJugadores();
        manoActual.setJugadorTurno(siguiente);

        actualizarMano(manoActual, codigo); //TODO: seguro hay un patrón de diseño para no tener que hacer esto con todos los metodos.
    }
                            
    public  void anteriorTurno(String codigo) { 
        Mano manoActual = getMano(codigo); 

        Integer jugadorActual = manoActual.getJugadorTurno();
        Integer anterior = obtenerJugadorAnterior(jugadorActual);
        manoActual.setJugadorTurno(anterior);

        actualizarMano(manoActual, codigo);
    }
                            
    public  Integer compararCartas(String codigo) {
        Mano manoActual = getMano(codigo);

        Integer poderMayor = 0;
        Integer empezador = null;
        List<Carta> cartasLanzadas = manoActual.getCartasLanzadasRonda();
        List<Integer> empate = new ArrayList<>();
        
        for (int i = 0; i < cartasLanzadas.size(); i++) {
            Integer poder = cartasLanzadas.get(i).getPoder();
            if (poderMayor < poder) {
                poderMayor = poder;
                empezador = i;
            } else if (poderMayor == poder) {
                empate.add(i);
                if (empate.size() == 1) {
                    empate.add(empezador);
                }
                empezador = null;
            }
        }

        
        gestionarGanadoresRonda(empate, empezador, codigo);
        

        empezador = empezador != null ? empezador : cercanoAMano(empate,codigo);

        manoActual.setCartasLanzadasRonda(new ArrayList<>());
        manoActual.setJugadorTurno(empezador);

        actualizarMano(manoActual, codigo);

        return empezador;
    }

    public  void gestionarGanadoresRonda(List<Integer> empates, Integer ganador, String codigo){
        Mano manoActual = getMano(codigo);

        List<Integer> ganadoresRonda = manoActual.getGanadoresRondas();
        Integer ganarRonda = 1;
        Integer ganadasEquipo1 = ganadoresRonda.get(0);
        Integer ganadasEquipo2 = ganadoresRonda.get(1);
        Boolean hayEquipo1 = false;
        Boolean hayEquipo2 = false;

        if(ganador!=null){
            if(ganador%2==0){
                hayEquipo1 = true;
            }else {
                hayEquipo2 = true;
            }

        } else {
            

            for(Integer jugador : empates){
                if(jugador%2==0){
                    hayEquipo1 = true;

                } else {
                    hayEquipo2 = true;
                }
            }

            
        }

        if(hayEquipo1 && hayEquipo2){
            ganadoresRonda.set(0, ganadasEquipo1 + ganarRonda);
            ganadoresRonda.set(1, ganadasEquipo2 + ganarRonda);
        } else if (hayEquipo1) {
            ganadoresRonda.set(0, ganadasEquipo1 + ganarRonda);
        } else {
            ganadoresRonda.set(1, ganadasEquipo2 + ganarRonda);
        }
        manoActual.setGanadoresRondas(ganadoresRonda);

        actualizarMano(manoActual, codigo);
    }

    

    public  Integer cercanoAMano(List<Integer> jugadores, String codigo) {
        Mano manoActual = getMano(codigo);
        Integer jugadorMano = manoActual.getPartida().getJugadorMano();
        Integer jugadorPreferencia = null;
        List<Integer> lista = new ArrayList<>();
        for (Integer j : jugadores) {
            if (j % 2 == jugadorMano % 2) {
                lista.add(j);
            }
        }
        if (lista.isEmpty()) {
            lista = jugadores;
        }
        for (int i = jugadorMano; jugadorPreferencia == null; i = siguienteJugador(i)) {
            if (lista.contains(i)) {
                jugadorPreferencia = i;
            }
        }
        return jugadorPreferencia;
    }

    public  Carta tirarCarta(Integer cartaId, String codigo) {
        Mano manoActual = getMano(codigo);
        if(!manoActual.getEsperandoRespuesta()){
            Carta cartaALanzar = cartaRepository.findById(cartaId).orElseThrow(()->  new NotFoundException("No se encontro esa carta"));
            Integer jugadorActual = manoActual.getJugadorTurno();
            
            List<Carta> cartasDisponibles = manoActual.getCartasDisp().get(jugadorActual);
            Integer indice = 0;
            for (int i=0; i < cartasDisponibles.size(); i++){
                if(cartasDisponibles.get(i)!= null){
                    if(cartasDisponibles.get(i).getId()==cartaALanzar.getId()){
                        indice=i;
                        
                    }
                }
                
            }

            manoActual.getCartasDisp().get(jugadorActual).set(indice,null);
            manoActual.getCartasLanzadasRonda().set(jugadorActual, cartaALanzar);

            List<Carta> listaCartasLanzadas = manoActual.getCartasLanzadasRonda();
            if(listaCartasLanzadas.stream().allMatch(c -> c!=null)){
                List<Carta> listaCartasLanzadasNuevo = new ArrayList<>();
                for (int i = 0; i <manoActual.getPartida().getNumJugadores(); i++){
                    listaCartasLanzadasNuevo.add(null);
                }
                manoActual.setCartasLanzadasRonda(listaCartasLanzadasNuevo);
                actualizarMano(manoActual, codigo); //importante que se actualice antes, ya que es la que se usara en comparar cartas
                compararCartas(codigo);
            } else{
                siguienteTurno(codigo);
                actualizarMano(manoActual, codigo);
            }

            
            
    
            return cartaALanzar;
        } else{
            throw new NotFoundException("No tenés más esa carta");
        }
        
    }

                            

    public Boolean puedeCantarEnvido(String codigo){
        Mano manoActual = getMano(codigo);
        Boolean sePuede = false;
        Boolean esRondaUno = obtenerRondaActual(codigo) ==1;
        Boolean esPie = false;
        Boolean noHayTruco = manoActual.getPuntosTruco() <= 1;
        Boolean noSeCanto = manoActual.getPuntosEnvido() == 0; //TODO: Evaluar esta funcion ya que para el "primer canto" de envido, real envido o falta envido esta funcion serviria, pero hay que revisar como se hacen los demás

        Integer jugTurno = manoActual.getJugadorTurno();
        Integer pie = obtenerJugadorPie();
        Integer otroPie = obtenerJugadorAnterior(pie);
    
        if(jugTurno == pie || jugTurno == otroPie) esPie = true;
    
    
        sePuede = esPie && noHayTruco && esPie && esRondaUno && noSeCanto; //DONE //FALTARIA COMPROBAR SI EL "otroPie" no lo canto, habría que añadir un puntaje de envido en mano y otro de truco
    
        return sePuede ;  //La idea de esto es que en el turno del jugador le aparezca, tambien es importante que si se canta truco en la primer ronda el siguiente le puede decir envido aunque no sea pie 

    }    

    public  Integer obtenerRondaActual(String codigo){
        Mano manoActual = getMano(codigo);
        Integer ronda = 0;
        List<List<Carta>> cartas = manoActual.getCartasDisp();
        Integer cartasPie = cartas.get(obtenerJugadorPie()).size();
        if (cartasPie ==3) ronda= 1;
        else if(cartasPie==2) ronda=2;
        else ronda =3;            
        return ronda;
    }

    //TODO: FALTAN TEST NEGATIVOS
    public void cantosTruco(CantosTruco canto, String codigo) throws Exception{
        Mano manoActual = getMano(codigo);
        Integer jugadorTurno = manoActual.getJugadorTurno();
        Integer equipoCantor = manoActual.getEquipoCantor();

        Integer rondaActual = obtenerRondaActual(codigo);
        List<List<Integer>> secuenciaCantos = manoActual.getSecuenciaCantoLista();
        List<Integer> listaRondaJugador = new ArrayList<>(); //Valores en el orden del nombre
        manoActual.setEsperandoRespuesta(true); // PARA PODER CONFIRMAR QUE EL QUE DICE QUIERO NO TIRA CARTA
        listaRondaJugador.add(rondaActual);
        listaRondaJugador.add(jugadorTurno);


        if (!manoActual.puedeCantarTruco()) {
            throw new Exception( "No podés cantar truco ni sus variantes"); //GESTIONAR MEJOR
        }
        Truco estadoTruco =  converterTruco.convertToEntityAttribute(canto);

        switch (canto) {
            case TRUCO: 

                manoActual = estadoTruco.accionAlTipoTruco(manoActual, jugadorTurno, equipoCantor, secuenciaCantos, listaRondaJugador, rondaActual,this,codigo);
                actualizarMano(manoActual, codigo);
            
            break;
        case RETRUCO:
            if (manoActual.getPuntosTruco() <2) {
                throw new Exception( "No se canto truco"); //GESTIONAR MEJOR
            }
            manoActual = estadoTruco.accionAlTipoTruco(manoActual,jugadorTurno, equipoCantor, secuenciaCantos, listaRondaJugador, rondaActual,this,codigo);
            actualizarMano(manoActual, codigo);
            break;
        case VALECUATRO:
            if (manoActual.getPuntosTruco() <3) {
                throw new Exception( "No se canto retruco"); //GESTIONAR MEJOR
            }
            manoActual = estadoTruco.accionAlTipoTruco(manoActual, jugadorTurno, equipoCantor, secuenciaCantos, listaRondaJugador, rondaActual, this,codigo);
            actualizarMano(manoActual, codigo);
            break;
        default:
                throw new Exception( "hubo algun error"); //GESTIONAR MEJOR
        }
    }
                                
    public  Integer quienResponde(List<Integer> cantoHecho, Integer jugadorTurno, String codigo){
        Integer res = null;
        Integer rondaActual = obtenerRondaActual(codigo);
        Integer jugadorAnterior = obtenerJugadorAnterior(jugadorTurno);
        Integer jugadorSiguiente = siguienteJugador(jugadorTurno);
        Integer rondaCanto = cantoHecho.get(0);
        Integer jugadorCanto = cantoHecho.get(1); 
        if (rondaActual==rondaCanto && jugadorAnterior== jugadorCanto) {
            res = jugadorAnterior;
        }else{
            res = jugadorSiguiente;
        }
        return res;
    }
      
    public void responderTruco(RespuestasTruco respuesta, String codigo) throws Exception{ 
        Mano manoActual = getMano(codigo);
        Integer jugadorTurno = manoActual.getJugadorTurno();
        Integer jugadorAnterior = obtenerJugadorAnterior(jugadorTurno);
        Integer truco = manoActual.getPuntosTruco();
        List<List<Integer>> secuenciaCantos = manoActual.getSecuenciaCantoLista();
        Integer queTrucoEs = secuenciaCantos.size();

        manoActual.setEsperandoRespuesta(false);

        RespuestaTruco respuestaTruco =   converterRespuestaTruco.convertToEntityAttribute(respuesta);
        // Boolean puedeEnvido = puedeCantarEnvido(); // TODO: IMPORTANTE VER COMO AGREGAR ESTA POSIBILIDAD
        switch (respuesta) {
            case QUIERO:
                manoActual= respuestaTruco.accionRespuestaTruco(manoActual,jugadorTurno, jugadorAnterior, truco, secuenciaCantos, queTrucoEs,this,codigo);
                actualizarMano(manoActual, codigo);
                break;
            case NO_QUIERO:
                //iria un terminarMano()
                    //Osea, se queda con truco -1 
                manoActual= respuestaTruco.accionRespuestaTruco(manoActual,jugadorTurno, jugadorAnterior, truco, secuenciaCantos, queTrucoEs,this,codigo);
                actualizarMano(manoActual, codigo);
                break;

            case SUBIR:

                manoActual= respuestaTruco.accionRespuestaTruco(manoActual,jugadorTurno, jugadorAnterior, truco, secuenciaCantos, queTrucoEs,this,codigo);
                actualizarMano(manoActual, codigo);
                break;
            default:
                throw new Exception( "hubo algun error"); //GESTIONAR MEJOR;
        }
    }
                        
                    
                
    

    public  Integer aQuienLeToca(List<Integer> cantoAnterior, List<Integer> cantoAhora, Integer jugadorTurno, String codigo) {
        Integer res = null;
        Integer rondaActual = obtenerRondaActual(codigo);
        Integer jugadorSiguiente = siguienteJugador(jugadorTurno);
        Integer jugadorAnterior = obtenerJugadorAnterior(jugadorTurno);

        Integer rondaCantoAnterior = cantoAnterior.get(0);
        Integer jugadorCantoAnterior = cantoAnterior.get(1);

        Integer rondaCantoAhora = cantoAhora.get(0);
        Integer jugadorCantoAhora = cantoAhora.get(1);
        if ((rondaCantoAnterior == rondaActual && rondaCantoAhora == rondaActual) && (jugadorCantoAnterior==jugadorTurno && jugadorCantoAhora== jugadorSiguiente)){
            res = jugadorTurno;
        }else{
            res = jugadorAnterior;
        }
        return res;
    }

    public List<List<Carta>> repartirCartas(Partida partida){
		Integer numJugadores = partida.getNumJugadores();
		List<List<Carta>> res = new ArrayList<>();
		Integer cartasEnLaBaraja = 40;
		Integer cartasPorJugador = 3;
		List<Integer> listaCartasId = IntStream.rangeClosed(1, cartasEnLaBaraja).boxed().collect(Collectors.toList());
		if (numJugadores * 3 > listaCartasId.size()) {
			throw new IllegalArgumentException("No hay suficientes cartas para todos los jugadores.");
		}
		Collections.shuffle(listaCartasId);
		int indiceCarta = 0;
    	for (int i = 0; i < numJugadores; i++) {
        	List<Carta> cartasJugador = new ArrayList<>();
        	for (int j = 0; j < cartasPorJugador; j++) {
            	Carta carta = findCarta(listaCartasId.get(indiceCarta++));
            	if (carta != null) {
            	    cartasJugador.add(carta);
            	}
        	}
        	res.add(cartasJugador);
    	}
		return res;
	}

	public Carta findCarta(Integer cartaId){
		Carta res = cartaRepository.findById(cartaId).orElse(null);
		return res;
	}

	
	public Mano crearMano(Partida partida){
		Mano nuevaMano = new Mano();
		
		nuevaMano.setPartida(partida);
		nuevaMano.setJugadorTurno(partida.getJugadorMano());
		nuevaMano.setCartasDisp(repartirCartas(partida));
		Integer ganadasIniciales = 0;
		List<Integer> ganadoresRonda = new ArrayList<>();
		ganadoresRonda.add(ganadasIniciales);
		ganadoresRonda.add(ganadasIniciales);
		nuevaMano.setGanadoresRondas(ganadoresRonda);

        List<Carta> listaCartasLanzadas = new ArrayList<>();
        for (int i = 0; i <partida.getNumJugadores(); i++){
            listaCartasLanzadas.add(null);
        }
        nuevaMano.setCartasLanzadasRonda(listaCartasLanzadas);

        manosPorPartida.put(partida.getCodigo(), nuevaMano);
		return nuevaMano;
	}
	

	public void terminarMano(Partida partida){
		Mano manoActual = getMano(partida.getCodigo());
		List<Integer> ganadoresRondaActual = manoActual.getGanadoresRondas();
		
		Integer equipoMano =partida.getJugadorMano() % 2; // equipo 1 = 0, equipo 2 = 1

		if(ganadoresRondaActual.get(0) == ganadoresRondaActual.get(1)){ // si hay empate, gana el mano

			if (equipoMano ==0)  partida.setPuntosEquipo1(manoActual.getPuntosTruco());

			else partida.setPuntosEquipo2(manoActual.getPuntosTruco());
			
		} else if (ganadoresRondaActual.get(0) >  ganadoresRondaActual.get(1)){
			partida.setPuntosEquipo1(manoActual.getPuntosTruco());

		} else {
			partida.setPuntosEquipo2(manoActual.getPuntosTruco());
		}

		if (partida.getEstado() == Estado.FINISHED) {
			//TODO
		} else {
            manosPorPartida.remove(partida.getCodigo());
			partida.setJugadorMano((partida.getJugadorMano() + 1) % partida.getNumJugadores());
			crearMano(partida);
            
		}
		
		
	}

}
