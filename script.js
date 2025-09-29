// Este archivo ahora solo inicializa el simulador modular
// Todas las funcionalidades se han movido a archivos separados en assets/js/

// Inicializar el simulador cuando se carga la página
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new WAFakeSimulator();
    // Exponer funciones globalmente para uso en HTML
    window.simulator = simulator;
});