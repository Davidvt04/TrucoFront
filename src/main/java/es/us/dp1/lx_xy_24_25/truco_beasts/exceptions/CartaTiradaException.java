package es.us.dp1.lx_xy_24_25.truco_beasts.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import lombok.Getter;

@ResponseStatus(value = HttpStatus.CONFLICT)
@Getter
public class CartaTiradaException extends RuntimeException {
    public CartaTiradaException() {
        super("Esa carta ya fue tirada, no podés volver a hacerlo");
    }
    public CartaTiradaException(String message) {
        super(message);
    }
}
