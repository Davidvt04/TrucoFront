package es.us.dp1.lx_xy_24_25.truco_beasts.chat;

import java.util.List;

import es.us.dp1.lx_xy_24_25.truco_beasts.model.BaseEntity;
import es.us.dp1.lx_xy_24_25.truco_beasts.partida.Partida;
import es.us.dp1.lx_xy_24_25.truco_beasts.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Chat extends BaseEntity {
    @OneToOne
    Partida partida;

    @ManyToMany
    List<User> usuarios; 
    
}
