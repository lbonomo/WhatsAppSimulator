class MessageManager {
    constructor() {
        this.messages = [];
    }

    // Inicializar con mensajes por defecto
    addDefaultMessages() {
        this.messages = []; // Sin mensajes iniciales
    }

    // Agregar un nuevo mensaje
    addMessage(type = 'text') {
        const newId = Math.max(...this.messages.map(m => m.id), 0) + 1;
        const newMessage = {
            id: newId,
            author: 1,
            type: type, // 'text' o 'voice'
            text: type === 'text' ? '' : null,
            delay: 2000
        };
        
        // Campos específicos para mensajes de voz
        if (type === 'voice') {
            newMessage.audioData = null; // Base64 del archivo de audio
            newMessage.audioFileName = null;
            newMessage.duration = 0; // Duración en segundos
            newMessage.waveform = null; // Datos de la forma de onda (opcional)
        }
        
        console.log('Mensaje creado:', newMessage); // Debug
        
        this.messages.push(newMessage);
        return newMessage;
    }

    // Actualizar un mensaje existente
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

    // Eliminar un mensaje
    deleteMessage(id) {
        const index = this.messages.findIndex(m => m.id === id);
        if (index !== -1) {
            this.messages.splice(index, 1);
            return true;
        }
        return false;
    }

    // Obtener todos los mensajes
    getMessages() {
        return this.messages;
    }

    // Obtener un mensaje específico
    getMessage(id) {
        return this.messages.find(m => m.id === id);
    }

    // Manejar archivo de audio para mensaje de voz
    async handleAudioFile(messageId, file) {
        const message = this.getMessage(messageId);
        if (!message || message.type !== 'voice') {
            throw new Error('Mensaje no válido para archivo de audio');
        }

        // Validar tipo de archivo
        const validTypes = [
            'audio/mp3', 
            'audio/mpeg', 
            'audio/wav', 
            'audio/wave',
            'audio/x-wav',
            'audio/ogg', 
            'audio/ogg; codecs=opus',
            'audio/ogg; codecs=vorbis',
            'audio/webm',
            'audio/webm; codecs=opus',
            'audio/m4a',
            'audio/mp4',
            'audio/x-m4a'
        ];
        
        // También validar por extensión de archivo como fallback
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.mp4'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!validTypes.includes(file.type) && !hasValidExtension) {
            throw new Error(`Tipo de archivo no soportado. 
                Archivo: ${file.name}
                Tipo detectado: ${file.type}
                Use MP3, WAV, OGG, WebM o M4A`);
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('El archivo es demasiado grande. Máximo 10MB');
        }

        try {
            // Convertir archivo a base64
            const audioData = await this.fileToBase64(file);
            
            // Obtener duración del audio
            const duration = await this.getAudioDuration(file);

            // Actualizar mensaje
            message.audioData = audioData;
            message.audioFileName = file.name;
            message.duration = duration;
            
            console.log('Audio procesado exitosamente:', {
                fileName: file.name,
                duration: duration,
                audioDataLength: audioData.length,
                messageId: messageId
            }); // Debug
            
            return true;
        } catch (error) {
            throw new Error('Error al procesar archivo de audio: ' + error.message);
        }
    }

    // Convertir archivo a base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    }

    // Obtener duración del audio
    getAudioDuration(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            let timeoutId = setTimeout(() => {
                URL.revokeObjectURL(url);
                console.warn('Timeout al obtener duración, usando duración por defecto');
                resolve(30); // Duración por defecto si falla
            }, 5000); // Timeout de 5 segundos
            
            audio.onloadedmetadata = () => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(url);
                const duration = audio.duration;
                if (isNaN(duration) || !isFinite(duration)) {
                    console.warn('Duración inválida, usando duración por defecto');
                    resolve(30);
                } else {
                    resolve(Math.round(duration));
                }
            };
            
            audio.onerror = (error) => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(url);
                console.warn('Error al cargar audio para obtener duración:', error);
                resolve(30); // Usar duración por defecto en lugar de fallar
            };
            
            // Configurar audio antes de cargar
            audio.preload = 'metadata';
            audio.src = url;
        });
    }

    // Formatear duración en formato MM:SS
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Renderizar la configuración de mensajes en la interfaz
    renderMessageConfigs(participants, voiceMessageManager) {
        const container = document.getElementById('messages-list');
        container.innerHTML = '';
        
        this.messages.forEach((message, index) => {
            let messageElement;
            
            if (message.type === 'voice') {
                messageElement = voiceMessageManager.createVoiceMessageConfig(message);
            } else {
                messageElement = this.createTextMessageConfig(message, index, participants);
            }
            
            container.appendChild(messageElement);
        });
    }

    // Crear configuración para mensaje de texto
    createTextMessageConfig(message, index, participants) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-config text-message-config';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-number">📝 Mensaje #${message.id}</span>
                <button class="delete-message" onclick="simulator.deleteMessage(${message.id})">×</button>
            </div>
            
            <div class="form-group">
                <label>Autor:</label>
                <select onchange="simulator.updateMessage(${message.id}, 'author', this.value)">
                    <option value="1" ${message.author === 1 ? 'selected' : ''}>Local (Derecha)</option>
                    <option value="2" ${message.author === 2 ? 'selected' : ''}>Contacto (Izquierda)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Mensaje:</label>
                <textarea placeholder="Escribe el mensaje aquí..." 
                         onchange="simulator.updateMessage(${message.id}, 'text', this.value)">${message.text}</textarea>
            </div>
            
            <div class="form-group">
                <label>Retraso (ms):</label>
                <input type="number" value="${message.delay}" min="100" step="100"
                       onchange="simulator.updateMessage(${message.id}, 'delay', parseInt(this.value))">
            </div>
        `;
        return messageDiv;
    }
}