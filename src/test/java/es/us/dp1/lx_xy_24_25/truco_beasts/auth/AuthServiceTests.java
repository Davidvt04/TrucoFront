package es.us.dp1.lx_xy_24_25.truco_beasts.auth;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import es.us.dp1.lx_xy_24_25.truco_beasts.auth.payload.request.SignupRequest;
import es.us.dp1.lx_xy_24_25.truco_beasts.user.AuthoritiesService;
import es.us.dp1.lx_xy_24_25.truco_beasts.user.User;
import es.us.dp1.lx_xy_24_25.truco_beasts.user.UserService;

@SpringBootTest
public class AuthServiceTests {

	@Autowired
	protected AuthService authService;
	@Autowired
	protected UserService userService;	
	@Autowired
	protected AuthoritiesService authoritiesService;

	@Test
	@Transactional
	public void shouldCreateAdminUser() {
		SignupRequest request = createRequest("ADMIN", "admin2");
		int userFirstCount = ((Collection<User>) this.userService.findAll()).size();
		this.authService.createUser(request);
		int userLastCount = ((Collection<User>) this.userService.findAll()).size();
		assertEquals(userFirstCount + 1, userLastCount);
	}
	
	
	
	@Test
	@Transactional
	public void shouldCreatePlayerUser() {
		SignupRequest request = createRequest("PLAYER", "playertest");
		int userFirstCount = ((Collection<User>) this.userService.findAll()).size();
		//int playerFirstCount = ((Collection<Player>) this.playerService.findAll()).size();
		this.authService.createUser(request);
		int userLastCount = ((Collection<User>) this.userService.findAll()).size();
		//int playerLastCount = ((Collection<Player>) this.playerService.findAll()).size();
		assertEquals(userFirstCount + 1, userLastCount);
		//assertEquals(playFirstCount + 1, playerLastCount);
	}

	private SignupRequest createRequest(String auth, String username) {
		SignupRequest request = new SignupRequest();
		request.setAuthority(auth);
		request.setFirstName("prueba");
		request.setLastName("prueba");
		request.setPassword("prueba");
		request.setUsername(username);

		if(auth == "PLAYER") {
			User playerUser = new User();
			playerUser.setUsername("clinicOwnerTest");
			playerUser.setPassword("clinicOwnerTest");
			playerUser.setIsConnected(false);
			playerUser.setAuthority(authoritiesService.findByAuthority("PLAYER"));
			userService.saveUser(playerUser);			
		}

		return request;
	}

}
