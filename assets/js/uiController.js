class UIController {
    constructor(participants, linkPreviewManager) {
        this.participants = participants;
        this.linkPreviewManager = linkPreviewManager;
    }

    // Configurar los event listeners
    setupEventListeners(simulator) {
        // Helper function to safely add event listeners
        const safeAddEventListener = (id, event, callback) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, callback);
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        };

        // Input de contacto
        safeAddEventListener('participant2-name', 'input', (e) => {
            this.participants[2].name = e.target.value;
            this.updateChatHeader();
            simulator.renderMessages();
        });
        
        safeAddEventListener('participant2-avatar', 'input', (e) => {
            this.participants[2].avatar = e.target.value || 'assets/img/avatar-default.svg';
            this.updateChatHeader();
            simulator.renderMessages();
        });

        // Botones de control
        safeAddEventListener('add-message', 'click', () => simulator.addMessage());
        safeAddEventListener('add-voice-message', 'click', () => simulator.addVoiceMessage());
        safeAddEventListener('start-simulation', 'click', () => simulator.startSimulation());
        safeAddEventListener('stop-simulation', 'click', () => simulator.stopSimulation());
        safeAddEventListener('reset-simulation', 'click', () => simulator.resetSimulation());
        
        // Botones de configuración
        safeAddEventListener('save-config', 'click', () => simulator.saveConfig());
        safeAddEventListener('load-config', 'click', () => simulator.loadConfig());
        safeAddEventListener('download-sample', 'click', () => simulator.downloadSampleConfig());
    }

    // Actualizar el header del chat
    updateChatHeader() {
        const participant = this.participants[2];
        const nameElement = document.getElementById('chat-contact-name');
        const avatarElement = document.getElementById('chat-contact-avatar');
        
        if (nameElement) {
            nameElement.textContent = participant.name;
        }
        if (avatarElement) {
            avatarElement.src = participant.avatar;
        }
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

    // Mostrar indicador de "escribiendo" o "grabando"
    showTypingIndicator(authorId, messageType = 'text') {
        // Solo mostrar indicador si es el participante 2 (el contacto)
        if (authorId === 2) {
            const statusElement = document.getElementById('chat-typing-status');
            
            // Cambiar el texto según el tipo de mensaje
            if (messageType === 'voice') {
                statusElement.textContent = 'grabando...';
            } else {
                statusElement.textContent = 'escribiendo...';
            }
            
            document.getElementById('chat-status').style.display = 'none';
            statusElement.classList.remove('hidden');
        }
        this.scrollToBottom();
    }

    // Ocultar indicador de "escribiendo"
    hideTypingIndicator() {
        const statusElement = document.getElementById('chat-typing-status');
        statusElement.textContent = 'escribiendo...'; // Restaurar texto por defecto
        statusElement.classList.add('hidden');
        document.getElementById('chat-status').style.display = 'block';
    }

    // Crear elemento de mensaje
    async createMessageElement(message, timeString, messageManager = null) {
        console.log('Creando mensaje:', message); // Debug
        
        if (message.type === 'voice') {
            return await this.createVoiceMessageElement(message, timeString, messageManager);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.author === 1 ? 'sent' : 'received'}`;
        
        let replyHTML = '';
        if (message.replyToId && messageManager) {
            const replyToMessage = messageManager.getMessage(message.replyToId);
            if (replyToMessage) {
                replyHTML = await this.createReplyHTML(replyToMessage, message.author);
            }
        }
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${replyHTML}
                <p class="message-text">${message.text}</p>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        return messageDiv;
    }

    // Crear elemento de mensaje de voz
    async createVoiceMessageElement(message, timeString, messageManager = null) {
        console.log('Creando mensaje de voz:', message); // Debug
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message voice-message ${message.author === 1 ? 'sent' : 'received'}`;
        
        const duration = message.duration || 0;
        const formattedDuration = this.formatDuration(duration);
        const hasAudio = message.audioData !== null && message.audioData !== undefined;
        const isReceived = message.author !== 1;
        
        console.log('Datos del audio:', { hasAudio, audioData: !!message.audioData, duration }); // Debug
        
        // Generar forma de onda aleatoria pero reproducible
        const waveformData = this.generateWaveform(message.id || 0, 42);
        const svgWidth = waveformData.totalWidth;
        
        let replyHTML = '';
        if (message.replyToId && messageManager) {
            const replyToMessage = messageManager.getMessage(message.replyToId);
            if (replyToMessage) {
                replyHTML = await this.createReplyHTML(replyToMessage, message.author);
            }
        }
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${replyHTML}
                <div class="audio-message">
                    <!-- Avatar con ícono de micrófono -->
                    <div class="voice-avatar-container">
                        <div class="voice-avatar">
                            <img src="assets/img/avatar-default.svg" alt="avatar">
                        </div>
                        <div class="voice-mic-icon">
                            <img src="assets/img/phone/micro-whats-received.svg" alt="mic">
                        </div>
                    </div>
                    
                    <!-- Contenido principal del audio -->
                    <div class="voice-content">
                        <!-- Botón play/pause -->
                        <div class="audio-play-pause" data-message-id="${message.id}">
                            <img src="assets/img/phone/play.svg" class="play-icon" alt="play">
                            <img src="assets/img/phone/pause.svg" class="pause-icon" alt="pause" style="display: none;">
                        </div>
                        
                        <!-- Forma de onda -->
                        <div class="audio-waveform-container">
                            <div class="audio-waveform">
                                <svg width="${svgWidth}" height="24" viewBox="0 0 ${svgWidth} 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    ${waveformData.bars}
                                    <circle cx="0" cy="12" r="5" fill="#52a6fe" class="audio-cursor" style="opacity: 0;"></circle>
                                </svg>
                            </div>
                            
                            <!-- Información debajo del waveform -->
                            <div class="audio-info">
                                <div class="audio-duration">${formattedDuration}</div>
                                <div class="audio-time-status">
                                    <span class="message-time">${timeString}</span>
                                    ${message.author === 1 ? '<span class="message-status">✓✓</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
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

    // Obtener imagen de OG rápidamente para respuestas (usa cache cuando esté disponible)
    async getOGImageForReply(url) {
        // Primero verificar el cache de imágenes
        const cachedImage = this.linkPreviewManager.getCachedOGImage(url);
        if (cachedImage) {
            return cachedImage;
        }
        
        // Verificar el cache de datos OG completos
        const cachedData = this.linkPreviewManager.getCachedOGData(url);
        if (cachedData && cachedData.image) {
            return cachedData.image;
        }
        
        // Si no está en cache, obtener los datos (esto guardará en cache para futuros usos)
        try {
            const ogData = await this.linkPreviewManager.getOpenGraphData(url);
            return ogData && ogData.image ? ogData.image : null;
        } catch (error) {
            console.log('Error getting OG image for reply:', error);
            return null;
        }
    }

    // Crear HTML para respuestas
    async createReplyHTML(replyToMessage, currentAuthor) {
        const borderColor = currentAuthor === 1 ? '#5c46d6' : '#00a763';
        const authorName = replyToMessage.author === 1 ? 'Tú' : this.participants[2].name;
        
        let replyContent = '';
        let hasLink = false;
        let linkThumbnail = '';
        
        if (replyToMessage.type === 'voice') {
            replyContent = '🎤 Mensaje de voz';
        } else {
            replyContent = replyToMessage.text || 'Mensaje vacío';
            
            // Detectar si tiene enlace
            if (this.linkPreviewManager) {
                const url = this.linkPreviewManager.extractUrl(replyContent);
                if (url) {
                    hasLink = true;
                    // Para enlaces, mostrar el texto completo pero truncado si es muy largo
                    if (replyContent.length > 100) {
                        replyContent = replyContent.substring(0, 97) + '...';
                    }
                    
                    // Obtener imagen de OG para el thumbnail
                    try {
                        const ogImage = await this.getOGImageForReply(url);
                        if (ogImage) {
                            // Crear thumbnail con la imagen de og:image
                            linkThumbnail = `
                                <div class="reply-thumbnail">
                                    <img src="${ogImage}" alt="Link preview" 
                                         style="width: 100%; height: 100%; object-fit: cover;"
                                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width: 100%; height: 100%; background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #999;\\'>🔗</div>';">
                                </div>
                            `;
                        } else {
                            // Fallback al ícono de enlace
                            linkThumbnail = `
                                <div class="reply-thumbnail">
                                    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #999;">
                                        🔗
                                    </div>
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.log('Error getting OG image for reply thumbnail:', error);
                        // Fallback al ícono de enlace
                        linkThumbnail = `
                            <div class="reply-thumbnail">
                                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #999;">
                                    🔗
                                </div>
                            </div>
                        `;
                    }
                }
            }
            
            // Truncar texto largo para respuestas sin enlaces
            if (!hasLink && replyContent.length > 80) {
                replyContent = replyContent.substring(0, 77) + '...';
            }
        }
        
        if (hasLink) {
            return `
                <div class="message-reply has-link" style="border-left: 3px solid ${borderColor};">
                    <div class="reply-text">
                        <div class="reply-author">${authorName}</div>
                        <div class="reply-content">${replyContent}</div>
                    </div>
                    ${linkThumbnail}
                </div>
            `;
        } else {
            return `
                <div class="message-reply" style="border-left: 3px solid ${borderColor};">
                    <div class="reply-author">${authorName}</div>
                    <div class="reply-content">${replyContent}</div>
                </div>
            `;
        }
    }

    // Generar forma de onda SVG
    generateWaveform(seed, barCount = 42) {
        let bars = '';
        const maxHeight = 18;
        const minHeight = 3;
        const barWidth = 2;
        const barSpacing = 4;
        
        // Calcular el ancho total real del SVG basado en las barras
        const totalWidth = (barCount - 1) * barSpacing + barWidth;
        
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
            
            bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#aaaaaa" rx="1" ry="1" data-bar="${i}"></rect>`;
        }
        
        // Retornar tanto las barras como el ancho total
        return { bars, totalWidth };
    }

    // Configurar reproducción de mensaje de voz
    setupVoiceMessagePlayback(messageElement, message) {
        const playBtn = messageElement.querySelector('.audio-play-pause');
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        const svg = messageElement.querySelector('.audio-waveform svg');
        const cursor = messageElement.querySelector('.audio-cursor');
        const durationElement = messageElement.querySelector('.audio-duration');
        const bars = messageElement.querySelectorAll('.audio-waveform svg rect');
        
        let audio = null;
        let isPlaying = false;
        let animationId = null;
        
        // Función para cambiar íconos
        function setPlayState(playing) {
            if (playing) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                playBtn.classList.add('playing');
                messageElement.classList.add('playing');
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                playBtn.classList.remove('playing');
                messageElement.classList.remove('playing');
            }
        }
        
        playBtn.addEventListener('click', async () => {
            console.log('Reproduciendo mensaje de voz:', message); // Debug
            
            if (!audio) {
                audio = new Audio(message.audioData);
                
                audio.addEventListener('loadedmetadata', () => {
                    console.log('Audio cargado, duración:', audio.duration); // Debug
                });
                
                audio.addEventListener('timeupdate', () => {
                    if (audio.duration && audio.duration > 0) {
                        const progress = Math.min(audio.currentTime / audio.duration, 1); // Asegurar que no exceda 1
                        
                        // Obtener el ancho real del SVG desde el viewBox
                        const svgViewBox = svg.viewBox.baseVal;
                        const svgWidth = svgViewBox.width;
                        
                        // Calcular posición del cursor de manera más precisa
                        const cursorX = Math.max(0, Math.min(progress * svgWidth, svgWidth - 5));
                        
                        // Mover cursor suavemente
                        cursor.setAttribute('cx', cursorX);
                        cursor.style.opacity = '1';
                        
                        // Actualizar barras reproducidas con mejor precisión
                        const playedBars = Math.floor(progress * bars.length);
                        bars.forEach((bar, index) => {
                            if (index <= playedBars) {
                                bar.classList.add('played');
                            } else {
                                bar.classList.remove('played');
                            }
                        });
                        
                        // Actualizar duración restante
                        const remaining = Math.max(0, audio.duration - audio.currentTime);
                        durationElement.textContent = this.formatDuration(Math.ceil(remaining));
                        
                        // Debug menos verboso
                        if (Math.floor(audio.currentTime * 10) % 5 === 0) { // Log cada 0.5 segundos
                            console.log(`Audio progreso: ${(progress * 100).toFixed(1)}% (${audio.currentTime.toFixed(1)}s/${audio.duration.toFixed(1)}s) - Cursor: ${cursorX.toFixed(1)}px`);
                        }
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
                setPlayState(false);
            } else {
                try {
                    // Configurar audio para autoplay en simulación
                    if (audio.dataset && audio.dataset.autoplay === 'true') {
                        audio.muted = false; // Asegurar que no esté silenciado para simulación
                    }
                    
                    await audio.play();
                    isPlaying = true;
                    setPlayState(true);
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
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        const cursor = messageElement.querySelector('.audio-cursor');
        const durationElement = messageElement.querySelector('.audio-duration');
        const bars = messageElement.querySelectorAll('.audio-waveform svg rect');
        
        // Resetear íconos
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
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