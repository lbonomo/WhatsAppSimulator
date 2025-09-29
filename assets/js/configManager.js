class ConfigManager {
    constructor(simulator) {
        this.simulator = simulator;
    }

    // Exportar toda la configuración a un objeto JSON
    exportConfig() {
        const config = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            participants: {
                1: { ...this.simulator.participants[1] },
                2: { ...this.simulator.participants[2] }
            },
            messages: this.simulator.messageManager.getMessages().map(msg => ({ ...msg }))
        };
        return config;
    }

    // Descargar configuración como archivo JSON
    downloadConfig(filename = null) {
        const config = this.exportConfig();
        const jsonString = JSON.stringify(config, null, 2);
        
        // Crear blob con el contenido JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Crear URL temporal
        const url = URL.createObjectURL(blob);
        
        // Crear elemento de descarga temporal
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `wa-simulator-config-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
        
        // Disparar descarga
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpiar URL temporal
        URL.revokeObjectURL(url);
        
        console.log('Configuración descargada:', a.download);
        
        // Mostrar notificación
        this.simulator.uiController.showNotification('💾 Configuración guardada exitosamente', 'success');
    }

    // Importar configuración desde un objeto JSON
    importConfig(config) {
        try {
            // Validar estructura básica
            if (!config || typeof config !== 'object') {
                throw new Error('Configuración inválida: no es un objeto válido');
            }

            if (!config.participants || !config.messages) {
                throw new Error('Configuración inválida: faltan datos de participantes o mensajes');
            }

            // Validar participantes
            if (!config.participants[1] || !config.participants[2]) {
                throw new Error('Configuración inválida: faltan datos de participantes');
            }

            // Validar mensajes
            if (!Array.isArray(config.messages)) {
                throw new Error('Configuración inválida: los mensajes deben ser un array');
            }

            // Detener simulación si está corriendo
            if (this.simulator.simulationEngine.isRunning()) {
                this.simulator.simulationEngine.stopSimulation();
            }

            // Actualizar participantes
            this.simulator.participants[1] = { ...config.participants[1] };
            this.simulator.participants[2] = { ...config.participants[2] };

            // Actualizar mensajes
            this.simulator.messageManager.messages = config.messages.map(msg => ({ ...msg }));

            // Actualizar UI
            this.updateUIFromConfig();

            console.log('Configuración importada exitosamente');
            
            // Mostrar notificación
            this.simulator.uiController.showNotification('📁 Configuración cargada exitosamente', 'success');
            
            return true;

        } catch (error) {
            console.error('Error al importar configuración:', error);
            this.simulator.uiController.showNotification('❌ Error al cargar la configuración: ' + error.message, 'error');
            return false;
        }
    }

    // Cargar configuración desde archivo
    loadConfigFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    this.importConfig(config);
                } catch (error) {
                    console.error('Error al parsear JSON:', error);
                    this.simulator.uiController.showNotification('❌ Error: El archivo no contiene un JSON válido', 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Actualizar la UI con la configuración cargada
    updateUIFromConfig() {
        // Actualizar inputs de participantes
        const nameInput = document.getElementById('participant2-name');
        const avatarInput = document.getElementById('participant2-avatar');
        
        if (nameInput) nameInput.value = this.simulator.participants[2].name;
        if (avatarInput) {
            // Solo mostrar la URL si no es el avatar por defecto
            const avatarUrl = this.simulator.participants[2].avatar;
            if (avatarUrl && !avatarUrl.includes('avatar-default.svg')) {
                avatarInput.value = avatarUrl;
            } else {
                avatarInput.value = '';
            }
        }

        // Actualizar header del chat
        this.simulator.uiController.updateChatHeader();

        // Re-renderizar mensajes
        this.simulator.renderMessageConfigs();

        // Limpiar chat
        this.simulator.resetSimulation();
    }

    // Validar configuración
    validateConfig(config) {
        const errors = [];

        if (!config.version) {
            errors.push('Falta versión de configuración');
        }

        if (!config.participants || Object.keys(config.participants).length < 2) {
            errors.push('Configuración de participantes incompleta');
        }

        if (!Array.isArray(config.messages)) {
            errors.push('Los mensajes deben ser un array');
        }

        // Validar estructura de mensajes
        config.messages?.forEach((msg, index) => {
            if (!msg.id || !msg.author || !msg.text) {
                errors.push(`Mensaje ${index + 1} tiene datos incompletos`);
            }
            if (![1, 2].includes(msg.author)) {
                errors.push(`Mensaje ${index + 1} tiene autor inválido`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Crear configuración de ejemplo
    createSampleConfig() {
        return {
            version: "1.0",
            timestamp: new Date().toISOString(),
            participants: {
                1: { name: 'Local (Derecha)', avatar: 'assets/img/avatar-default.svg' },
                2: { name: 'Contacto Ejemplo', avatar: 'assets/img/avatar-default.svg' }
            },
            messages: [
                {
                    id: 1,
                    author: 2,
                    text: 'Hola, ¿cómo estás?',
                    delay: 1000
                },
                {
                    id: 2,
                    author: 1,
                    text: '¡Hola! Muy bien, gracias. ¿Y tú?',
                    delay: 2000
                }
            ]
        };
    }

    // Descargar configuración de ejemplo
    downloadSampleConfig() {
        const sampleConfig = this.createSampleConfig();
        const jsonString = JSON.stringify(sampleConfig, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wa-simulator-config-example.json';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.simulator.uiController.showNotification('📄 Ejemplo de configuración descargado', 'info');
    }
}