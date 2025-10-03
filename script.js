// Este archivo ahora solo inicializa el simulador modular
// Todas las funcionalidades se han movido a archivos separados en assets/js/

// Inicializar el simulador cuando se carga la página
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Iniciando JAWSSimulator...');
        simulator = new JAWSSimulator();
        // Exponer funciones globalmente para uso en HTML
        window.simulator = simulator;
        console.log('JAWSSimulator inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar JAWSSimulator:', error);
        console.error('Stack trace:', error.stack);
    }
});