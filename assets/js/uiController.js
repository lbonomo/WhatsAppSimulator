class UIController {
    constructor(participants, linkPreviewManager) {
        this.participants = participants;
        this.linkPreviewManager = linkPreviewManager;
    }

    // Configurar los event listeners
    setupEventListeners(simulator) {
        // Input de contacto
        document.getElementById('participant2-name').addEventListener('input', (e) => {
            this.participants[2].name = e.target.value;
            this.updateChatHeader();
            simulator.renderMessages();
        });
        
        document.getElementById('participant2-avatar').addEventListener('input', (e) => {
            this.participants[2].avatar = e.target.value || 'assets/img/avatar-default.svg';
            this.updateChatHeader();
            simulator.renderMessages();
        });

        // Botones de control
        document.getElementById('add-message').addEventListener('click', () => simulator.addMessage());
        document.getElementById('add-voice-message').addEventListener('click', () => simulator.addVoiceMessage());
        document.getElementById('start-simulation').addEventListener('click', () => simulator.startSimulation());
        document.getElementById('stop-simulation').addEventListener('click', () => simulator.stopSimulation());
        document.getElementById('reset-simulation').addEventListener('click', () => simulator.resetSimulation());
        
        // Botones de configuración
        document.getElementById('save-config').addEventListener('click', () => simulator.saveConfig());
        document.getElementById('load-config').addEventListener('click', () => simulator.loadConfig());
        document.getElementById('download-sample').addEventListener('click', () => simulator.downloadSampleConfig());
    }

    // Actualizar el header del chat
    updateChatHeader() {
        const participant = this.participants[2];
        document.getElementById('chat-contact-name').textContent = participant.name;
        document.getElementById('chat-contact-avatar').src = participant.avatar;
    }

    // Limpiar el chat
    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Agregar separador de fecha
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-separator';
        dateDiv.innerHTML = '<span>Hoy</span>';
        chatMessages.appendChild(dateDiv);
        
        this.hideTypingIndicator();
    }

    // Mostrar indicador de "escribiendo"
    showTypingIndicator(authorId) {
        // Solo mostrar "escribiendo..." si es el participante 2 (el contacto)
        if (authorId === 2) {
            document.getElementById('chat-status').style.display = 'none';
            document.getElementById('chat-typing-status').classList.remove('hidden');
        }
        this.scrollToBottom();
    }

    // Ocultar indicador de "escribiendo"
    hideTypingIndicator() {
        document.getElementById('chat-status').style.display = 'block';
        document.getElementById('chat-typing-status').classList.add('hidden');
    }

    // Crear elemento de mensaje
    createMessageElement(message, timeString) {
        console.log('Creando mensaje:', message); // Debug
        
        if (message.type === 'voice') {
            return this.createVoiceMessageElement(message, timeString);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.author === 1 ? 'sent' : 'received'}`;
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <p class="message-text">${message.text}</p>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        return messageDiv;
    }

    // Crear elemento de mensaje de voz
    createVoiceMessageElement(message, timeString) {
        console.log('Creando mensaje de voz:', message); // Debug
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message voice-message ${message.author === 1 ? 'sent' : 'received'}`;
        
        const duration = message.duration || 0;
        const formattedDuration = this.formatDuration(duration);
        const hasAudio = message.audioData !== null && message.audioData !== undefined;
        const isReceived = message.author !== 1;
        
        console.log('Datos del audio:', { hasAudio, audioData: !!message.audioData, duration }); // Debug
        
        // Generar forma de onda aleatoria pero reproducible
        const waveformBars = this.generateWaveform(message.id || 0, 75);
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="audio-message">
                    <div class="audio-play-pause" data-message-id="${message.id}">
                    </div>
                    <div class="audio-waveform">
                        <svg width="150" height="24" viewBox="0 0 150 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            ${waveformBars}
                            <circle cx="0" cy="12" r="5" fill="#52a6fe" class="audio-cursor" style="opacity: 0;"></circle>
                        </svg>
                        <div class="audio-duration">${formattedDuration}</div>
                        <div class="audio-read-status">
                            <span>${timeString}</span>
                        </div>
                    </div>
                    ${isReceived ? `
                        <div class="audio-profile">
                            <img src="assets/img/avatar-remoto.svg" alt="profile">
                        </div>
                        <div class="micro-whats-received-container">
                            <img src="assets/img/phone/micro-whats-received.svg" class="micro-whats-received" alt="received icon">
                        </div>
                    ` : ''}
                    ${!hasAudio ? '<div class="voice-placeholder">📎 Audio no disponible</div>' : ''}
                </div>
            </div>
        `;
        
        // Agregar funcionalidad de reproducción si hay audio
        if (hasAudio) {
            this.setupVoiceMessagePlayback(messageDiv, message);
        }
        
        return messageDiv;
    }

    // Generar forma de onda SVG
    generateWaveform(seed, barCount = 75) {
        let bars = '';
        const maxHeight = 18;
        const minHeight = 3;
        const barWidth = 2;
        const barSpacing = 4;
        
        // Usar semilla para reproducibilidad
        let rng = seed;
        function random() {
            rng = (rng * 9301 + 49297) % 233280;
            return rng / 233280;
        }
        
        for (let i = 0; i < barCount; i++) {
            const height = minHeight + random() * (maxHeight - minHeight);
            const x = i * barSpacing;
            const y = (24 - height) / 2;
            
            bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#bebebe" rx="1" ry="1" data-bar="${i}"></rect>`;
        }
        
        return bars;
    }

    // Configurar reproducción de mensaje de voz
    setupVoiceMessagePlayback(messageElement, message) {
        const playBtn = messageElement.querySelector('.audio-play-pause');
        const svg = messageElement.querySelector('.audio-waveform svg');
        const cursor = messageElement.querySelector('.audio-cursor');
        const durationElement = messageElement.querySelector('.audio-duration');
        const bars = messageElement.querySelectorAll('.audio-waveform svg rect');
        
        let audio = null;
        let isPlaying = false;
        let animationId = null;
        
        playBtn.addEventListener('click', async () => {
            console.log('Reproduciendo mensaje de voz:', message); // Debug
            
            if (!audio) {
                audio = new Audio(message.audioData);
                
                audio.addEventListener('loadedmetadata', () => {
                    console.log('Audio cargado, duración:', audio.duration); // Debug
                });
                
                audio.addEventListener('timeupdate', () => {
                    if (audio.duration) {
                        const progress = audio.currentTime / audio.duration;
                        const svgWidth = 150;
                        const cursorX = progress * svgWidth;
                        
                        // Mover cursor
                        cursor.setAttribute('cx', cursorX);
                        cursor.style.opacity = '1';
                        
                        // Actualizar barras reproducidas
                        const playedBars = Math.floor(progress * bars.length);
                        bars.forEach((bar, index) => {
                            if (index <= playedBars) {
                                bar.classList.add('played');
                            } else {
                                bar.classList.remove('played');
                            }
                        });
                        
                        // Actualizar duración restante
                        const remaining = audio.duration - audio.currentTime;
                        durationElement.textContent = this.formatDuration(Math.ceil(remaining));
                    }
                });
                
                audio.addEventListener('ended', () => {
                    console.log('Reproducción terminada'); // Debug
                    this.resetVoiceMessage(messageElement, message);
                });
                
                audio.addEventListener('error', (e) => {
                    console.error('Error reproduciendo audio:', e); // Debug
                });
            }
            
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                playBtn.classList.remove('playing');
                messageElement.classList.remove('playing');
            } else {
                try {
                    // Configurar audio para autoplay en simulación
                    if (audio.dataset && audio.dataset.autoplay === 'true') {
                        audio.muted = false; // Asegurar que no esté silenciado para simulación
                    }
                    
                    await audio.play();
                    isPlaying = true;
                    playBtn.classList.add('playing');
                    messageElement.classList.add('playing');
                    console.log('Audio reproduciéndose...'); // Debug
                } catch (error) {
                    console.error('Error al reproducir audio:', error); // Debug
                    
                    // Si falla el autoplay, intentar con usuario interaction
                    if (error.name === 'NotAllowedError') {
                        console.log('Autoplay bloqueado, reproducir manualmente'); // Debug
                    }
                }
            }
        });
        
        // Hacer clickeable la forma de onda para saltar a posición
        svg.addEventListener('click', (e) => {
            if (audio && audio.duration) {
                const rect = svg.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progress = clickX / rect.width;
                audio.currentTime = progress * audio.duration;
            }
        });
    }
    
    // Resetear estado del mensaje de voz
    resetVoiceMessage(messageElement, message) {
        const playBtn = messageElement.querySelector('.audio-play-pause');
        const cursor = messageElement.querySelector('.audio-cursor');
        const durationElement = messageElement.querySelector('.audio-duration');
        const bars = messageElement.querySelectorAll('.audio-waveform svg rect');
        
        // Resetear botón
        playBtn.classList.remove('playing');
        messageElement.classList.remove('playing');
        
        // Resetear cursor
        cursor.setAttribute('cx', '0');
        cursor.style.opacity = '0';
        
        // Resetear barras
        bars.forEach(bar => bar.classList.remove('played'));
        
        // Resetear duración
        durationElement.textContent = this.formatDuration(message.duration || 0);
    }

    // Método para reproducción automática desde simulación
    autoPlayVoiceMessage(messageElement) {
        const playBtn = messageElement.querySelector('.audio-play-pause');
        if (playBtn) {
            // Marcar como autoplay para evitar problemas de políticas del navegador
            const audio = messageElement.querySelector('audio');
            if (audio) {
                audio.dataset.autoplay = 'true';
            }
            
            // Simular click en el botón
            playBtn.click();
        }
    }

    // Formatear duración en formato MM:SS
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Crear elemento de mensaje con vista previa de enlace integrada
    createMessageElementWithPreview(message, timeString, ogData, url) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.author === 1 ? 'sent' : 'received'}`;
        
        const previewHTML = ogData ? this.linkPreviewManager.createLinkPreview(ogData) : '';
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${previewHTML ? `<div class="link-preview-content">${previewHTML}</div>` : ''}
                <p class="message-text">${message.text}</p>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        // Si hay vista previa, hacer que sea clickeable
        if (previewHTML && url) {
            const previewElement = messageDiv.querySelector('.link-preview-content');
            if (previewElement) {
                previewElement.onclick = () => {
                    window.open(url, '_blank');
                };
                previewElement.style.cursor = 'pointer';
            }
        }
        
        return messageDiv;
    }

    // Crear indicador de carga para vista previa
    createLoadingPreview(authorId) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = `link-preview ${authorId === 1 ? 'sent' : 'received'}`;
        loadingDiv.innerHTML = `
            <div class="link-preview-content">
                <div class="link-preview-loading">
                    <div class="loading-spinner"></div>
                    Cargando vista previa...
                </div>
            </div>
        `;
        return loadingDiv;
    }

    // Crear indicador de carga dentro del message-bubble
    createLoadingPreviewInside() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'link-preview-content loading';
        loadingDiv.innerHTML = `
            <div class="link-preview-loading">
                <div class="loading-spinner"></div>
                Cargando vista previa...
            </div>
        `;
        return loadingDiv;
    }

    // Crear elemento de vista previa de enlace
    createLinkPreviewElement(ogData, authorId, url) {
        const previewDiv = document.createElement('div');
        previewDiv.className = `link-preview ${authorId === 1 ? 'sent' : 'received'}`;
        previewDiv.innerHTML = this.linkPreviewManager.createLinkPreview(ogData);
        
        // Hacer que el preview sea clickeable
        previewDiv.onclick = () => {
            window.open(url, '_blank');
        };
        previewDiv.style.cursor = 'pointer';
        
        return previewDiv;
    }

    // Actualizar vista previa dentro del message-bubble
    updateMessagePreview(messageElement, ogData, url) {
        const messageBubble = messageElement.querySelector('.message-bubble');
        const loadingElement = messageBubble.querySelector('.link-preview-content.loading');
        
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (ogData) {
            const previewElement = document.createElement('div');
            previewElement.className = 'link-preview-content';
            previewElement.innerHTML = this.linkPreviewManager.createLinkPreview(ogData);
            
            // Hacer que sea clickeable
            previewElement.onclick = () => {
                window.open(url, '_blank');
            };
            previewElement.style.cursor = 'pointer';
            
            // Insertar al principio del message-bubble
            const messageText = messageBubble.querySelector('.message-text');
            messageBubble.insertBefore(previewElement, messageText);
            
            this.scrollToBottom();
        }
    }

    // Agregar mensaje al chat
    appendMessage(messageElement) {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Hacer scroll hacia abajo
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Actualizar botones de simulación
    updateSimulationButtons(isSimulating) {
        const startButton = document.getElementById('start-simulation');
        
        if (isSimulating) {
            startButton.textContent = 'Simulando...';
            startButton.disabled = true;
        } else {
            startButton.textContent = 'Iniciar Simulación';
            startButton.disabled = false;
        }
    }

    // Mostrar notificación temporal
    showNotification(message, type = 'success') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Estilos inline para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease',
            backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'
        });
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}