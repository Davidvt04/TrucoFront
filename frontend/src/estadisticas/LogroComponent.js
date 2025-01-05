import { useState } from 'react';

const LogroComponent = ({ logro }) => {
    const [hovered, setHovered] = useState(false);

    const nombre = logro.name;
    const descripcion = logro.descripcion;
    const urlImagen = logro.imagencita;
    const oculto = logro.oculto

    function convertirMetrica (metrica){
        let res = metrica.toLowerCase()
        res = res.replace("_", " ")
        res = res.charAt(0).toUpperCase() + res.slice(1)
        return res
    }
    const metricaValor = convertirMetrica(logro.metrica)
    const resumen = `${metricaValor} es ${logro.valor} o superior`;

    const logroContentStyle = {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0)',
    };

    const imageWrapperStyle = {
        position: 'relative',
        width: '150px',
        height: '150px',
        marginBottom: '10px',
    };

    const logroImageStyle = {
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        objectFit: 'cover',
    };

    const hoverOverlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        borderRadius: '10px',
    };

    const hoverTextStyle = {
        color: 'white',
        fontSize: '16px',
        textAlign: 'center',
        padding: '5px',
    };

    const nombreStyle = {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: '10px 0',
        wordWrap: 'break-word', 
        textAlign: 'center',
    };

    const descripcionStyle = {
        fontSize: '18px',
        color: '#FFFFFF',
        marginTop: '5px',
        wordWrap: 'break-word', 
        textAlign: 'center',
    };

    return (
        <div
            style={logroContentStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <h4 style={nombreStyle}>{nombre}{logro.oculto && <span style={{ color: 'gold', marginLeft: '8px' }}>⭐</span>}</h4>
            <div style={imageWrapperStyle}>
                <img
                    src={urlImagen}
                    alt={resumen}
                    style={logroImageStyle}
                />
                <div style={hoverOverlayStyle}>
                    <small style={hoverTextStyle}>{resumen}</small>
                </div>
            </div>
            <p style={descripcionStyle}>{descripcion}</p>
        </div>
    );
};

export default LogroComponent;
