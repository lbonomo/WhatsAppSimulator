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
    processNextMessage() {
        const messages = this.messageManager.getMessages();
        
        if (!this.isSimulating || this.messageIndex >= messages.length) {
            this.stopSimulation();
            return;
        }

        const message = messages[this.messageIndex];
        const delay = message.delay || 2000;

        // Mostrar indicador de "escribiendo"
        this.uiController.showTypingIndicator(message.author);

        // Simular tiempo de escritura (mínimo 1 segundo, máximo delay/2)
        const typingTime = Math.min(Math.max(1000, delay / 2), 3000);

        setTimeout(() => {
            this.uiController.hideTypingIndicator();
            this.displayMessage(message);
            this.messageIndex++;
            
            // Continuar con el siguiente mensaje después de un breve pausa
            setTimeout(() => {
                this.processNextMessage();
            }, 500);
        }, typingTime);
    }

    // Mostrar un mensaje en el chat
    async displayMessage(message) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Detectar si el mensaje contiene una URL
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