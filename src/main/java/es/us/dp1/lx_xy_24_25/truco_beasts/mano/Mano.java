package es.us.dp1.lx_xy_24_25.truco_beasts.mano;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;


import es.us.dp1.lx_xy_24_25.truco_beasts.carta.Carta;
import es.us.dp1.lx_xy_24_25.truco_beasts.partida.Partida;
import jakarta.persistence.ManyToOne;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
public class Mano {
    
    private List<List<Carta>> cartasDisp; // La lista de cartas de la posicion 0 seran las cartas que tiene el jugador en la posicion 0
    private Integer jugadorTurno; // Por defecto sera el jugador mano
    private List<Carta> cartasLanzadasRonda; // IMPORTANTE !!!! : se inicializa como lista de nulls y cada carta sustituye al null de la posicion de su jugador (se borran en cada ronda)
    private List<Integer> ganadoresRondas;
    private Integer rondaActual = 1;
    private Integer puntosTruco=1;
    private Integer puntosEnvido =0;
    private List<List<Carta>> cartasLanzadasTotales; //Esta lista contiene las cartas que lanzo cada jugador siendo el indice de la lista grande, el jugador, y el de la sublista, la ronda en la que la lanzo
    private Integer esTrucoEnvidoFlor = 0; // 0 -> Truco, 1 -> envido, 2 -> flor
    private Integer equipoCantor = null;
    private Boolean esperandoRespuesta = false;
    private Integer jugadorIniciadorDelCanto;
    private Boolean terminada = false;
    private Boolean puedeCantarTruco = true;
    private Boolean puedeCantarEnvido = false;
    private Integer queEnvidoPuedeCantar = 2; //1 -> solo falta envido, 2 -> falta y real, 3 -> falta, real y envido, otro -> nada
    private Integer equipoGanadorEnvido;

    private Cantos ultimoMensaje;


    private final Integer constanteEnvido=20;
    private final Integer puntosMaximosDelTruco = 4;
    private final Integer rondasMaximasGanables = 2;
    
    List<Integer> envidosCadaJugador;

    private List<Integer> envidosCantados;
    @ManyToOne
    private Partida partida;

    public void copiaParcialTruco(Mano mano) {
        this.equipoCantor = mano.getEquipoCantor();
        this.esperandoRespuesta = mano.getEsperandoRespuesta();
        this.jugadorTurno = mano.getJugadorTurno();
        this.puntosTruco = mano.getPuntosTruco();
        this.queEnvidoPuedeCantar = mano.getQueEnvidoPuedeCantar();
        this.puedeCantarEnvido = mano.getPuedeCantarEnvido();
        this.terminada = mano.getTerminada();
        this.ultimoMensaje = mano.getUltimoMensaje();
    }

    public  Boolean comprobarSiPuedeCantarTruco() { //O SUS OTRAS POSIBILIDADES
        Boolean res;
        if(getPuntosMaximosDelTruco() == getPuntosTruco()){
            res = false;
        } else{
            Integer equipoCantor = getEquipoCantor();
            Integer jugadorTurno = getJugadorTurno();
            res =(equipoCantor == null || jugadorTurno % 2 != equipoCantor);
            
        }
        setPuedeCantarTruco(res);
        
        return res;
    }
    final Integer maximosEnvido = 2;
    final Integer maximosRealEnvido =1;
    final Integer maximosFaltaEnvido = 1; 

    public Boolean comprobarSiPuedeCantarEnvido(Boolean fueraDeCantos) { //O SUS OTRAS POSIBILIDADES
        Boolean res;
        if(getRondaActual() != 1 || getPuntosEnvido() !=0 || getPuntosTruco() > 1){
            res = false;
        } else{
            List<Integer> listaEnvidos = getEnvidosCantados();
            Integer envidos = listaEnvidos.get(0);
            Integer realEnvido = listaEnvidos.get(1);
            Integer faltaEnvido = listaEnvidos.get(2);
            if(faltaEnvido ==maximosFaltaEnvido){
                res=false;
                setQueEnvidoPuedeCantar(0);
            } else if(realEnvido ==maximosRealEnvido){
                res =true;
                setQueEnvidoPuedeCantar(1);
            } else if (envidos == maximosEnvido) {
                res = true;
                setQueEnvidoPuedeCantar(2);
            } else{
                res =true;
                setQueEnvidoPuedeCantar(3);
            }
            Integer jugador = getJugadorTurno();
            Integer jugadorPie = obtenerJugadorPie();
            Boolean esPie = jugador==jugadorPie || siguienteJugador(jugador) == jugadorPie;
            if(fueraDeCantos){
                res = res &&  esPie;
            }
             
        }
        setPuedeCantarEnvido(res);
        return res;
    }



   

     public List<Integer> listaTantosCadaJugador(){ 
        List<Integer> listaEnvidosCadaJugador = new ArrayList<>();
        for(int i=0; i<getCartasDisp().size(); i++){
            Map<Palo, List<Carta>> diccCartasPaloJugador = agrupaCartasPalo(cartasDisp.get(i));
            Integer sumaJugador= getMaxPuntuacion(diccCartasPaloJugador);
            listaEnvidosCadaJugador.add(i, sumaJugador);
        }

        Integer jugadorMano = getJugadorTurno(); //Como esta funcion se llama al principio, será el mano
        List<Integer> nuevaLista = new ArrayList<>(listaEnvidosCadaJugador);
    
        Integer equipoMano = jugadorMano % 2;
        Integer equipoQueVaGanando = equipoMano;
        
        Integer puntajeGanador = listaEnvidosCadaJugador.get(jugadorMano);
        for(int i = siguienteJugador(jugadorMano); i!=jugadorMano;i= siguienteJugador(i)){ //TIENE QUE SER MÁS FÁCIL SEGURO
            Integer puntajeNuevoJugador = listaEnvidosCadaJugador.get(i);
            if(puntajeNuevoJugador == puntajeGanador){
                if(equipoQueVaGanando == equipoMano){
                    nuevaLista.set(i, null);
                } else {
                    equipoQueVaGanando = equipoMano;
                }
            } else if(puntajeNuevoJugador > puntajeGanador){ //TODO: NO SE CONTEMPLA SI HAY QUE HACER MARCHA ATRAS (CREO QUE NO LO VAMOS A HACER)
                equipoQueVaGanando = i%2;
                puntajeGanador = puntajeNuevoJugador;
            }else{
                nuevaLista.set(i, null);
            }
            
        }
        setEquipoGanadorEnvido(equipoQueVaGanando);
        setEnvidosCadaJugador(nuevaLista);
        return nuevaLista;
    }

    
     public Integer getMaxPuntuacion (Map<Palo, List<Carta>> diccCartasPaloJugador) {
        List< Integer> listaSumasPalo= new ArrayList<>();
        for(Map.Entry<Palo, List<Carta>> cartasPaloJugador : diccCartasPaloJugador.entrySet()){
            if(cartasPaloJugador.getValue().size()==1){
                listaSumasPalo.add( comprobarValor(cartasPaloJugador.getValue().get(0).getValor()));
            }
            else if(cartasPaloJugador.getValue().size()==2){
                Integer valor1= cartasPaloJugador.getValue().get(0).getValor();
                Integer valor2= cartasPaloJugador.getValue().get(1).getValor();
                listaSumasPalo.add(  20 + comprobarValor(valor1) + comprobarValor(valor2));
            }else if(cartasPaloJugador.getValue().size()==3){
                Integer valor= cartasPaloJugador.getValue().stream().map(x-> comprobarValor(x.getValor())).sorted(Comparator.reverseOrder()).limit(2).reduce(0, (a, b) -> a+b);
                listaSumasPalo.add( valor+constanteEnvido);
            }
        }
        Integer puntosEnvidoJugador = listaSumasPalo.stream().max(Comparator.naturalOrder()).get();
        return puntosEnvidoJugador;
    }

    public Integer comprobarValor(Integer value) {
        return value>=10?0:value;
    }

    public Map<Palo, List<Carta>> agrupaCartasPalo(List<Carta> listaDeCartas){
        Map<Palo, List<Carta>> diccCartasPaloJugador = listaDeCartas.stream().collect(Collectors.groupingBy(Carta::getPalo));
        return diccCartasPaloJugador;
    }

    public  Integer obtenerJugadorPie(){
        Integer pie = obtenerJugadorAnterior(getPartida().getJugadorMano());
        return pie;
    }
                       
    public  Integer obtenerJugadorAnterior(Integer jugador) { 
        Integer numJugadores = getPartida().getNumJugadores();
        return (jugador + numJugadores - 1) % numJugadores;
    }
        
    public  Integer siguienteJugador(Integer jugadorActual) {
        Integer siguiente = (jugadorActual + 1) % getPartida().getNumJugadores();
        return siguiente;
    }
            
    public  void siguienteTurno() {      
        Integer jugadorActual = getJugadorTurno();
        Integer siguiente = (jugadorActual + 1) % getPartida().getNumJugadores();
        setJugadorTurno(siguiente);
    }
                            
    public  void anteriorTurno() {
        Integer jugadorActual = getJugadorTurno();
        Integer anterior = obtenerJugadorAnterior(jugadorActual);
        setJugadorTurno(anterior);
    }
                            
    public  Integer compararCartas() {

        Integer poderMayor = 0;
        Integer empezador = null;
        List<Carta> cartasLanzadas = getCartasLanzadasRonda();
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

        gestionarGanadoresRonda(empate, empezador);
        
        empezador = empezador != null ? empezador : cercanoAMano(empate);

        setRondaActual(getRondaActual()+1);

        haTerminadoLaMano();
        List<Carta> listaCartasLanzadasNuevo = new ArrayList<>();
        for (int i = 0; i < getPartida().getNumJugadores(); i++){
            listaCartasLanzadasNuevo.add(null);
        }
        setCartasLanzadasRonda(listaCartasLanzadasNuevo);
        setJugadorTurno(empezador);
        return empezador;
    }

    public void haTerminadoLaMano() {
        Boolean res = false;
        Integer rondasEquipo1 = getGanadoresRondas().get(0);
        Integer rondasEquipo2 = getGanadoresRondas().get(1);
        if(getRondaActual()==4) {
            res = true;
        } else if(getGanadoresRondas().contains(rondasMaximasGanables) && rondasEquipo1+rondasEquipo2!=4) {
            res = true;
        }
        setTerminada(res);
    }

    public void gestionarGanadoresRonda(List<Integer> empates, Integer ganador){

        List<Integer> ganadoresRonda = getGanadoresRondas();
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
        setGanadoresRondas(ganadoresRonda);
    }

    

    public  Integer cercanoAMano(List<Integer> jugadores) {
        Integer jugadorMano = getPartida().getJugadorMano();
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

    


                                
    

    public Integer quienResponde(){
        Integer jugadorQueResponde;
        Integer jugadorIniciador = getJugadorIniciadorDelCanto();
        Integer jugadorSiguiente = siguienteJugador(jugadorIniciador);
        Integer jugadorActual = getJugadorTurno();
        if(jugadorActual==jugadorIniciador){
            jugadorQueResponde = jugadorSiguiente;
        }else{
            jugadorQueResponde=jugadorIniciador;
        }
        return jugadorQueResponde;
    }
}


