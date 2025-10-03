class SimulationEngine {
    constructor(messageManager, uiController, linkPreviewManager) {
        this.messageManager = messageManager;
        this.uiController = uiController;
        this.linkPreviewManager = linkPreviewManager;
        this.currentSimulation = null;
        this.messageIndex = 0;
        this.isSimulating = false;
    }

    // Iniciar la simulación
    startSimulation() {
        if (this.isSimulating) {
            this.stopSimulation();
        }
        
        this.isSimulating = true;
        this.messageIndex = 0;
        
        // Limpiar chat
        this.uiController.clearChat();
        
        // Actualizar botones
        this.uiController.updateSimulationButtons(true);
        
        // Comenzar simulación
        this.processNextMessage();
    }

    // Procesar el siguiente mensaje en la cola
    async processNextMessage() {
        const messages = this.messageManager.getMessages();
        
        if (!this.isSimulating || this.messageIndex >= messages.length) {
            this.stopSimulation();
            return;
        }

        const message = messages[this.messageIndex];
        const delay = message.delay || 2000;

        // Mostrar indicador de "escribiendo" o "grabando" según el tipo de mensaje
        this.uiController.showTypingIndicator(message.author, message.type);

        // Simular tiempo de escritura/grabación (mínimo 1 segundo, máximo delay/2)
        const typingTime = Math.min(Math.max(1000, delay / 2), 3000);

        setTimeout(async () => {
            this.uiController.hideTypingIndicator();
            await this.displayMessage(message);
            this.messageIndex++;
            
            // Si es un mensaje de voz, esperar a que termine la reproducción
            if (message.type === 'voice' && message.audioData && message.duration) {
                // Esperar la duración del audio más un pequeño buffer
                const voiceDelay = (message.duration * 1000) + 1000; // duration en segundos * 1000 + 1 segundo buffer
                setTimeout(() => {
                    this.processNextMessage();
                }, voiceDelay);
            } else {
                // Continuar con el siguiente mensaje después de un breve pausa
                setTimeout(() => {
                    this.processNextMessage();
                }, 500);
            }
        }, typingTime);
    }

    // Mostrar un mensaje en el chat
    async displayMessage(message) {
        console.log('Mostrando mensaje en simulación:', message); // Debug
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Manejar diferentes tipos de mensajes
        if (message.type === 'voice') {
            console.log('Procesando mensaje de voz:', {
                id: message.id,
                hasAudio: !!message.audioData,
                duration: message.duration
            }); // Debug
            
            // Mensaje de voz
            const messageElement = this.uiController.createMessageElement(message, timeString);
            this.uiController.appendMessage(messageElement);
            
            // Reproducir automáticamente el mensaje de voz después de un breve delay
            if (message.audioData) {
                setTimeout(() => {
                    this.uiController.autoPlayVoiceMessage(messageElement);
                }, 500); // Esperar 500ms para que se complete la animación de aparición
            }
        } else {
            // Mensaje de texto - detectar si contiene URL
            const url = this.linkPreviewManager.extractUrl(message.text);
            
            if (url) {
                // Crear mensaje con indicador de carga integrado
                const messageElement = this.uiController.createMessageElement(message, timeString);
                
                // Agregar indicador de carga dentro del message-bubble
                const messageBubble = messageElement.querySelector('.message-bubble');
                const loadingElement = this.uiController.createLoadingPreviewInside();
                const messageText = messageBubble.querySelector('.message-text');
                messageBubble.insertBefore(loadingElement, messageText);
                
                this.uiController.appendMessage(messageElement);
                
                // Obtener datos Open Graph
                const ogData = await this.linkPreviewManager.getOpenGraphData(url);
                
                // Actualizar con la vista previa real
                this.uiController.updateMessagePreview(messageElement, ogData, url);
            } else {
                // Mensaje sin URL - crear normalmente
                const messageElement = this.uiController.createMessageElement(message, timeString);
                this.uiController.appendMessage(messageElement);
            }
        }
        
        // Reproducir sonido
        this.playMessageSound();
    }

    // Reproducir sonido de mensaje
    playMessageSound() {
        try {
            // Audio simple con Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Ignorar errores de audio
        }
    }

    // Detener la simulación
    stopSimulation() {
        this.isSimulating = false;
        this.uiController.hideTypingIndicator();
        
        if (this.currentSimulation) {
            clearTimeout(this.currentSimulation);
        }
        
        // Restaurar botones
        this.uiController.updateSimulationButtons(false);
    }

    // Reiniciar la simulación
    resetSimulation() {
        this.stopSimulation();
        this.uiController.clearChat();
        this.messageIndex = 0;
    }

    // Verificar si está simulando
    isRunning() {
        return this.isSimulating;
    }
}