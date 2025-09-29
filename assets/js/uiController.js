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