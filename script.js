class WAFakeSimulator {
    constructor() {
        this.participants = {
            1: { name: 'Local (Derecha)', avatar: 'assets/img/avatar-local.svg' },
            2: { name: 'Lucas Bonomo', avatar: 'assets/img/avatar-lucas.svg' }
        };
        this.messages = [];
        this.currentSimulation = null;
        this.messageIndex = 0;
        this.isSimulating = false;
        this.linkCache = new Map(); // Cache para evitar múltiples requests
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addDefaultMessages();
        this.updateChatHeader();
    }

    // Detectar URLs en el texto
    extractUrl(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);
        return urls ? urls[0] : null; // Retorna la primera URL encontrada
    }

    // Obtener metadatos Open Graph de una URL usando múltiples proxies
    async getOpenGraphData(url) {
        // Verificar cache primero
        if (this.linkCache.has(url)) {
            console.log('Using cached data for:', url);
            return this.linkCache.get(url);
        }

        console.log('Fetching OG data for:', url);

        // Lista de proxies CORS para probar
        const proxies = [
            `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ];

        for (const proxyUrl of proxies) {
            try {
                console.log(`Trying proxy: ${proxyUrl}`);
                
                // Agregar timeout de 5 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(proxyUrl, { 
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'WAFake-Bot/1.0'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    console.log(`Proxy failed with status: ${response.status}`);
                    continue;
                }

                const html = await response.text();
                
                if (html && html.length > 0) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const ogImage = doc.querySelector('meta[property="og:image"]');
                    const ogTitle = doc.querySelector('meta[property="og:title"]');
                    const ogDescription = doc.querySelector('meta[property="og:description"]');
                    const title = doc.querySelector('title');
                    
                    // Si encontramos al menos algo útil, devolvemos los datos
                    if (ogImage || ogTitle || title) {
                        const data = {
                            image: ogImage ? ogImage.getAttribute('content') : null,
                            title: ogTitle ? ogTitle.getAttribute('content') : (title ? title.textContent.trim() : null),
                            description: ogDescription ? ogDescription.getAttribute('content') : null,
                            url: url
                        };
                        
                        // Guardar en cache
                        this.linkCache.set(url, data);
                        return data;
                    }
                }
            } catch (error) {
                console.log(`Proxy error: ${error.message}`);
                continue;
            }
        }

        // Si todos los proxies fallan, crear una vista previa básica
        console.log('All proxies failed, creating basic preview');
        const basicData = this.createBasicPreview(url);
        // Guardar en cache el resultado básico
        this.linkCache.set(url, basicData);
        return basicData;
    }

    // Crear vista previa básica cuando no se pueden obtener metadatos
    createBasicPreview(url) {
        try {
            const urlObj = new URL(url);
            return {
                image: null,
                title: urlObj.hostname,
                description: 'Enlace web',
                url: url,
                isBasic: true
            };
        } catch (error) {
            return null;
        }
    }

    setupEventListeners() {
        // Input de contacto
        document.getElementById('participant2-name').addEventListener('input', (e) => {
            this.participants[2].name = e.target.value;
            this.updateChatHeader();
            this.renderMessages();
        });
        
        document.getElementById('participant2-avatar').addEventListener('input', (e) => {
            this.participants[2].avatar = e.target.value || 'assets/img/avatar-lucas.svg';
            this.updateChatHeader();
            this.renderMessages();
        });

        // Botones de control
        document.getElementById('add-message').addEventListener('click', () => this.addMessage());
        document.getElementById('start-simulation').addEventListener('click', () => this.startSimulation());
        document.getElementById('stop-simulation').addEventListener('click', () => this.stopSimulation());
        document.getElementById('reset-simulation').addEventListener('click', () => this.resetSimulation());
    }

    addDefaultMessages() {
        this.messages = [
            {
                id: 1,
                author: 2,
                text: 'Buen día',
                delay: 1000
            },
            {
                id: 2,
                author: 1,
                text: 'Hola!!! ✨ ¡Gracias por comunicarte con Esencia Nómada!\n👍 Nuestro horario de atención es de\nlunes a viernes de 9:00 a 17:00 🏠\n🧭 Déjanos tu consulta y te responderemos a la brevedad.\nSaludos 🌱🌈✨🌺',
                delay: 2000
            },
            {
                id: 3,
                author: 2,
                text: 'Te puedo hacer una consulta?',
                delay: 3000
            },
            {
                id: 4,
                author: 1,
                text: '¡Por supuesto! Te dejo nuestro sitio web: https://esencianomada.com.ar/producto/club-de-nuit-sillage/',
                delay: 2000
            }
        ];
        this.renderMessageConfigs();
    }

    addMessage() {
        const newId = Math.max(...this.messages.map(m => m.id), 0) + 1;
        const newMessage = {
            id: newId,
            author: 1,
            text: '',
            delay: 2000
        };
        
        this.messages.push(newMessage);
        this.renderMessageConfigs();
    }

    renderMessageConfigs() {
        const container = document.getElementById('messages-list');
        container.innerHTML = '';
        
        this.messages.forEach((message, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-config';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-number">Mensaje ${index + 1}</span>
                    <button class="delete-message" onclick="simulator.deleteMessage(${message.id})">Eliminar</button>
                </div>
                
                <label>Autor:</label>
                <select onchange="simulator.updateMessage(${message.id}, 'author', this.value)">
                    <option value="1" ${message.author === 1 ? 'selected' : ''}>Tú (mensaje verde, derecha)</option>
                    <option value="2" ${message.author === 2 ? 'selected' : ''}>${this.participants[2].name} (mensaje blanco, izquierda)</option>
                </select>
                
                <label>Mensaje:</label>
                <textarea placeholder="Escribe el mensaje aquí..." 
                         onchange="simulator.updateMessage(${message.id}, 'text', this.value)">${message.text}</textarea>
                
                <label>Delay (milisegundos):</label>
                <input type="number" value="${message.delay}" min="100" step="100"
                       onchange="simulator.updateMessage(${message.id}, 'delay', parseInt(this.value))">
            `;
            container.appendChild(messageDiv);
        });
    }

    updateMessage(id, field, value) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            if (field === 'author') {
                message[field] = parseInt(value);
            } else {
                message[field] = value;
            }
        }
    }

    deleteMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        this.renderMessageConfigs();
        if (this.isSimulating) {
            this.stopSimulation();
        }
    }

    updateChatHeader() {
        // Mostrar info del participante 2 (el "contacto")
        const participant = this.participants[2];
        document.getElementById('chat-contact-name').textContent = participant.name;
        document.getElementById('chat-contact-avatar').src = participant.avatar;
    }

    startSimulation() {
        if (this.isSimulating) {
            this.stopSimulation();
        }
        
        this.isSimulating = true;
        this.messageIndex = 0;
        
        // Limpiar chat
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Agregar separador de fecha
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-separator';
        dateDiv.innerHTML = '<span>Hoy</span>';
        chatMessages.appendChild(dateDiv);
        
        
        this.hideTypingIndicator();
        
        // Actualizar botones
        document.getElementById('start-simulation').textContent = 'Simulando...';
        document.getElementById('start-simulation').disabled = true;
        
        // Comenzar simulación
        this.processNextMessage();
    }

    processNextMessage() {
        if (!this.isSimulating || this.messageIndex >= this.messages.length) {
            this.stopSimulation();
            return;
        }

        const message = this.messages[this.messageIndex];
        const delay = message.delay || 2000;

        // Mostrar indicador de "escribiendo"
        this.showTypingIndicator(message.author);

        // Simular tiempo de escritura (mínimo 1 segundo, máximo delay/2)
        const typingTime = Math.min(Math.max(1000, delay / 2), 3000);

        setTimeout(() => {
            this.hideTypingIndicator();
            this.displayMessage(message);
            this.messageIndex++;
            
            // Continuar con el siguiente mensaje después de un breve pausa
            setTimeout(() => {
                this.processNextMessage();
            }, 500);
        }, typingTime);
    }

    showTypingIndicator(authorId) {
        // Solo mostrar "escribiendo..." si es el participante 2 (el contacto)
        if (authorId === 2) {
            document.getElementById('chat-status').style.display = 'none';
            document.getElementById('chat-typing-status').classList.remove('hidden');
        }
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        document.getElementById('chat-status').style.display = 'block';
        document.getElementById('chat-typing-status').classList.add('hidden');
    }

    async displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const participant = this.participants[message.author];
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.author === 1 ? 'sent' : 'received'}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Detectar si el mensaje contiene una URL
        const url = this.extractUrl(message.text);
        let linkPreviewHTML = '';
        
        if (url) {
            // Mostrar mensaje primero, luego cargar preview
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    <p class="message-text">${message.text}</p>
                    <div class="message-time">${timeString}</div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            this.scrollToBottom();
            
            // Mostrar indicador de carga
            const loadingDiv = document.createElement('div');
            loadingDiv.className = `link-preview ${message.author === 1 ? 'sent' : 'received'}`;
            loadingDiv.innerHTML = `
                <div class="link-preview-content">
                    <div class="link-preview-loading">
                        <div class="loading-spinner"></div>
                        Cargando vista previa...
                    </div>
                </div>
            `;
            messageDiv.appendChild(loadingDiv);
            this.scrollToBottom();
            
            // Obtener datos Open Graph
            const ogData = await this.getOpenGraphData(url);
            
            // Remover indicador de carga
            loadingDiv.remove();
            
            // Siempre mostrar una vista previa, aunque sea básica
            if (ogData) {
                linkPreviewHTML = this.createLinkPreview(ogData);
                
                // Agregar preview debajo del mensaje
                const previewDiv = document.createElement('div');
                previewDiv.className = `link-preview ${message.author === 1 ? 'sent' : 'received'}`;
                previewDiv.innerHTML = linkPreviewHTML;
                
                // Hacer que el preview sea clickeable
                previewDiv.onclick = () => {
                    window.open(url, '_blank');
                };
                previewDiv.style.cursor = 'pointer';
                
                messageDiv.appendChild(previewDiv);
                this.scrollToBottom();
            }
        } else {
            // Mensaje sin URL
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    <p class="message-text">${message.text}</p>
                    <div class="message-time">${timeString}</div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            this.scrollToBottom();
        }
        
        // Reproducir sonido (opcional)
        this.playMessageSound();
    }

    createLinkPreview(ogData) {
        const isBasic = ogData.isBasic;
        const iconClass = isBasic ? 'basic-preview' : '';
        
        return `
            <div class="link-preview-content ${iconClass}">
                ${ogData.image ? `<img src="${ogData.image}" alt="Preview" class="link-preview-image" onerror="this.style.display='none'">` : 
                  (isBasic ? `<div class="link-preview-icon">🔗</div>` : '')}
                <div class="link-preview-info">
                    ${ogData.title ? `<div class="link-preview-title">${ogData.title}</div>` : ''}
                    ${ogData.description ? `<div class="link-preview-description">${ogData.description}</div>` : ''}
                    <div class="link-preview-url">${new URL(ogData.url).hostname}</div>
                </div>
            </div>
        `;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    playMessageSound() {
        // Se puede agregar un sonido de notificación aquí
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

    stopSimulation() {
        this.isSimulating = false;
        this.hideTypingIndicator();
        
        if (this.currentSimulation) {
            clearTimeout(this.currentSimulation);
        }
        
        // Restaurar botones
        document.getElementById('start-simulation').textContent = 'Iniciar Simulación';
        document.getElementById('start-simulation').disabled = false;
    }

    resetSimulation() {
        this.stopSimulation();
        document.getElementById('chat-messages').innerHTML = '';
        this.messageIndex = 0;
    }

    renderMessages() {
        // Método para renderizar mensajes en vista previa (opcional)
        // Se puede usar para mostrar una vista previa de los mensajes configurados
    }
}

// Inicializar el simulador cuando se carga la página
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new WAFakeSimulator();
});

// Exponer funciones globalmente para uso en HTML
window.simulator = simulator;