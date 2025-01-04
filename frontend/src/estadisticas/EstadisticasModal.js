import { forwardRef, useEffect, useState } from 'react';
import useFetchState from '../util/useFetchState.js';
import Highcharts, { color } from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { IoCloseCircle } from "react-icons/io5";
import tokenService from '../services/token.service.js';
import HighchartsMore from 'highcharts/highcharts-more';
const jwt = tokenService.getLocalAccessToken();
const EstadisticasModal = forwardRef((props, ref) => {
    const closeModal = () => props.setModalVisible(false);
    const [message, setMessage] = useState(null);
    const [visible, setVisible] = useState(false);
    const [graficoComparativo, setGraficoComparativo] = useState(false);
    const [estadisticas, setEstadisticas] = useFetchState({}, '/api/v1/estadisticas/misEstadisticas', jwt, setMessage, setVisible)
    const [estadisticasGlobales, setEstadisticasGlobales] = useFetchState({}, '/api/v1/estadisticas/estadisticasGlobales', jwt, setMessage, setVisible)
    const [graficoActualPartidas, setGraficoActualPartidas] = useState("resultados");
    const victoriasDerrotas = {
        chart: {
            type: 'pie',
            backgroundColor: 'rgba(0, 0, 0, 0)',
        },
        title: {
            text: 'Resultados en ' + (estadisticas.partidasJugadas || 0) + ' partidas',
            style: { color: '#ffffff' }
        },
        pane: {
            size: '80%'
        },
        series: [{
            name: 'Resultados',
            colorByPoint: true,
            data: [
                { name: 'Victorias', y: estadisticas.victorias || 0, color: '#4caf50' },
                { name: 'Derrotas', y: estadisticas.derrotas || 0, color: '#f44336' },
            ]
        }]
    };
    const tiposPartidas = {
        chart: {
            backgroundColor: 'rgba(0, 0, 0, 0)',
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: {
            text: 'Tipos de Partidas',
            style: { color: '#ffffff' }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        pane: {
            size: '80%'
        },
        series: [{
            name: 'Cantidad',
            type: 'pie',
            innerSize: '50%',
            data: [
                ['Partidas de a 2', estadisticas.partidasA2 || 0],
                ['Partidas de a 4', estadisticas.partidasA4 || 0],
                ['Partidas de a 6', estadisticas.partidasA6 || 0],
            ],
            pointPlacement: 'on',
            color: '#2196f3'
        }]
    };
    function cambiarGrafico() {
        setGraficoActualPartidas(graficoActualPartidas === "resultados" ? "tiposPartidas" : "resultados");
    }
    function cambiarAGraficoComparativo() {
        setGraficoComparativo(!graficoComparativo);
    }
    const globalModoAraña = {
        chart: {
            polar: true,
            type: 'line',
            backgroundColor: 'rgba(0, 0, 0, 0)',
        },
        title: {
            text: 'Comparativa con el promedio global',
            x: -80,
            style: { color: '#ffffff' }
        },
        pane: {
            size: '80%'
        },
        xAxis: {
            categories: [
                'Victorias', 'Derrotas',
                'Flores cantadas', 'Partidas a 2',
                'Partidas a 4', 'Partidas a 6', 'Tiempo jugado'
            ],
            tickmarkPlacement: 'on',
            lineWidth: 0,
            labels: {
                style: { color: '#ffffff' }
            }
        },
        yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0,
            labels: {
                style: { color: '#ffffff' }
            }
        },
        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b> {point.y:,.3f}</b><br/>'
        },
        legend: {
            align: 'right',
            verticalAlign: 'middle',
            layout: 'vertical'
        },
        series: [
            {
                name: 'Promedio Personal',
                data: [
                    estadisticas.victorias / estadisticas.partidasJugadas || 0,
                    estadisticas.derrotas / estadisticas.partidasJugadas || 0,
                    estadisticas.floresCantadas / estadisticas.partidasConFlor || 0,
                    estadisticas.partidasA2 / (estadisticas.partidasJugadas *2) || 0,
                    estadisticas.partidasA4 / (estadisticas.partidasJugadas*4) || 0, //no estoy del todo seguro, pero al ser 4 jugadores, 
                    estadisticas.partidasA6 / (estadisticas.partidasJugadas*6) || 0, //deberia dividirse para que la media no se infle artificalmente, no?
                ],
                pointPlacement: 'on',
                color: '#4caf50',
                lineWidth: 3,
                marker: {
                    enabled: true
                }
            },
            {
                name: 'Promedio Global',
                data: [
                    estadisticasGlobales.victorias / estadisticasGlobales.partidasJugadas || 0,
                    estadisticasGlobales.derrotas / estadisticasGlobales.partidasJugadas || 0,
                    estadisticasGlobales.floresCantadas / estadisticasGlobales.partidasConFlor || 0,
                    estadisticasGlobales.partidasA2 / estadisticasGlobales.partidasJugadas || 0,
                    estadisticasGlobales.partidasA4 / estadisticasGlobales.partidasJugadas || 0,
                    estadisticasGlobales.partidasA6 / estadisticasGlobales.partidasJugadas || 0,
                ],
                pointPlacement: 'on',
                color: '#2196f3',
                lineWidth: 3,
                marker: {
                    enabled: true
                }
            },
        ],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    title: {
                        x: 0
                    },
                    legend: {
                        align: 'center',
                        verticalAlign: 'bottom',
                        layout: 'horizontal'
                    },
                    pane: {
                        size: '70%'
                    }
                }
            }]
        }
    }
    function calcularTiempo(tiemposEnSegundos, partidasTotales) {
        let promedio = partidasTotales !== 0 ? tiemposEnSegundos / partidasTotales : tiemposEnSegundos;
        if (isNaN(promedio)) {
            promedio = tiemposEnSegundos;  
        }
        let horas = Math.floor(promedio / 3600); 
        let minutos = Math.floor((promedio % 3600) / 60); 
        let segundos = Math.floor(promedio % 60); 
    
        
        let tiempoFormateado = `${horas}:${minutos < 10 ? '0' + minutos : minutos}:${segundos < 10 ? '0' + segundos : segundos}`;
    
        return tiempoFormateado;
    }
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.38)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            zIndex: 1000,
        }}>
            {console.log(calcularTiempo(estadisticas.tiempoJugado,estadisticas.partidasJugadas))}
            <div style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '24px',
            }}>
                <IoCloseCircle
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 30,
                        height: 30,
                        cursor: 'pointer',
                        color: 'white',
                    }}
                    onClick={closeModal}
                />
                <div style={{ display: 'flex', width: '80%', height: '80%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <h2 style={{ color: 'white', marginBottom: '20px' }}>Estadísticas</h2>
                    <div style={{ width: '90%', maxWidth: '600px' }}>
                        {!graficoComparativo && <HighchartsReact
                            highcharts={Highcharts}
                            options={graficoActualPartidas === "resultados" ? victoriasDerrotas : tiposPartidas}
                        />}
                        {graficoComparativo && <HighchartsReact
                            highcharts={Highcharts}
                            options={globalModoAraña}
                        />}
                    </div>
                    {!graficoComparativo && <button
                        onClick={() => cambiarGrafico()}
                        style={{
                            marginRight: '10px',
                            padding: '10px 20px',
                            backgroundColor: cambiarGrafico === "resultados" ? '#4caf50' : '#757575',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        {graficoActualPartidas === "resultados" ? "Tipos de Partidas" : "Resultados"}
                    </button>}
                    <button
                        onClick={() => cambiarAGraficoComparativo()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: graficoComparativo ? '#4caf50' : '#757575',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >{graficoComparativo ? "Volver" : "Ver comparativa global"}</button>
                </div>
            </div>
        </div>
    );
});
export default EstadisticasModal;