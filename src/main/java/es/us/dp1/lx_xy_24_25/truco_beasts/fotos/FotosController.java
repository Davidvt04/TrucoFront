package es.us.dp1.lx_xy_24_25.truco_beasts.fotos;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/fotos")
@Tag(name = "Fotos", description = "La pequeña API de gestión de las fotos de trofeos y perfiles. Se debe estar autenticado para utilizarla.")
@SecurityRequirement(name = "bearerAuth")
public class FotosController {

    private final FotosService fotosService;

    public FotosController(FotosService fotosService){
        this.fotosService = fotosService;
    }

    @Operation(summary = "Obtener todas las fotos de trofeos", description = "Devuelve una lista de nombres de fotos de trofeos.")
    @GetMapping("/trofeos")
    public ResponseEntity<List<String>> findAllTrofeosFotos (){
        return ResponseEntity.ok(fotosService.findNombresFotoByTipo(CategoriaFoto.TROFEO));
    }

    @Operation(summary = "Obtener todas las fotos de perfiles", description = "Devuelve una lista de nombres de fotos de perfiles.")
    @GetMapping("/perfiles")
    public ResponseEntity<List<String>> findAllPerfilesFotos (){
        return ResponseEntity.ok(fotosService.findNombresFotoByTipo(CategoriaFoto.PERFIL));
    }  
    
}
