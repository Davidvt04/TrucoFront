package es.us.dp1.lx_xy_24_25.your_game_name.jugador;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JugadorService {
    private JugadorRepository jugadorRepository;

    @Autowired
    public JugadorService(JugadorRepository jugadorRepository){
        this.jugadorRepository = jugadorRepository;
    }
    
    @Transactional(readOnly = true)
    public Collection<Jugador> encontrarTodos() {
        return (List<Jugador>) jugadorRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Optional<Jugador> encontrarJugadorPorId(int id) throws DataAccessException{
        return jugadorRepository.findById(id);
    }
   
}
