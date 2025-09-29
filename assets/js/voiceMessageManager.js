/**
 * Clase para manejar la interfaz de configuración de mensajes de voz
 */
class VoiceMessageManager {
    constructor(messageManager, uiController) {
        this.messageManager = messageManager;
        this.uiController = uiController;
    }

    // Crear interfaz de configuración para mensaje de voz
    createVoiceMessageConfig(message) {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item voice-message-config';
        messageItem.dataset.messageId = message.id;
        
        messageItem.innerHTML = `
            <div class="message-header">
                <span class="message-label">🎤 Mensaje de Voz #${message.id}</span>
                <button class="delete-message" data-id="${message.id}">×</button>
            </div>
            
            <div class="voice-config-content">
                <div class="form-group">
                    <label>Autor:</label>
                    <select class="message-author" data-id="${message.id}">
                        <option value="1" ${message.author === 1 ? 'selected' : ''}>Local (Derecha)</option>
                        <option value="2" ${message.author === 2 ? 'selected' : ''}>Contacto (Izquierda)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Archivo de Audio:</label>
                    <div class="audio-upload-area" data-message-id="${message.id}">
                        ${this.createAudioUploadInterface(message)}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Retraso (ms):</label>
                    <input type="number" class="message-delay" data-id="${message.id}" 
                           value="${message.delay}" min="0" step="100">
                </div>
                
                ${message.audioData ? this.createAudioPreview(message) : ''}
            </div>
        `;
        
        this.setupVoiceConfigEvents(messageItem, message);
        return messageItem;
    }

    // Crear interfaz de carga de audio
    createAudioUploadInterface(message) {
        if (message.audioData) {
            return `
                <div class="audio-loaded">
                    <div class="audio-info">
                        <span class="audio-filename">📎 ${message.audioFileName}</span>
                        <span class="audio-duration">${this.formatDuration(message.duration)}</span>
                    </div>
                    <button class="change-audio-btn" data-message-id="${message.id}">Cambiar Audio</button>
                    <button class="remove-audio-btn" data-message-id="${message.id}">Eliminar</button>
                </div>
                <input type="file" class="audio-file-input" 
                       accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.mp4" 
                       data-message-id="${message.id}" style="display: none;">
            `;
        } else {
            return `
                <div class="audio-upload-placeholder">
                    <div class="upload-icon">🎤</div>
                    <div class="upload-text">
                        <strong>Arrastra un archivo de audio aquí</strong><br>
                        o <button class="select-audio-btn" data-message-id="${message.id}">selecciona un archivo</button>
                    </div>
                    <div class="upload-formats">Formatos: MP3, WAV, OGG, WebM, M4A (máx. 10MB)</div>
                </div>
                <input type="file" class="audio-file-input" 
                       accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.mp4" 
                       data-message-id="${message.id}" style="display: none;">
            `;
        }
    }

    // Crear vista previa del audio
    createAudioPreview(message) {
        return `
            <div class="audio-preview">
                <div class="preview-header">Vista Previa:</div>
                <div class="voice-message-preview">
                    <button class="preview-play-btn" data-audio-data="${message.audioData}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <div class="preview-waveform">
                        <div class="preview-progress-bar">
                            <div class="preview-progress" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="preview-duration">${this.formatDuration(message.duration)}</div>
                </div>
            </div>
        `;
    }

    // Configurar eventos para la configuración de mensaje de voz
    setupVoiceConfigEvents(messageItem, message) {
        const messageId = message.id;
        
        // Cambio de autor
        const authorSelect = messageItem.querySelector('.message-author');
        authorSelect.addEventListener('change', (e) => {
            this.messageManager.updateMessage(messageId, 'author', parseInt(e.target.value));
        });
        
        // Cambio de delay
        const delayInput = messageItem.querySelector('.message-delay');
        delayInput.addEventListener('input', (e) => {
            this.messageManager.updateMessage(messageId, 'delay', parseInt(e.target.value));
        });
        
        // Eventos de carga de audio
        this.setupAudioUploadEvents(messageItem, messageId);
        
        // Evento de eliminación
        const deleteBtn = messageItem.querySelector('.delete-message');
        deleteBtn.addEventListener('click', () => {
            this.messageManager.deleteMessage(messageId);
            messageItem.remove();
        });
    }

    // Configurar eventos de carga de audio
    setupAudioUploadEvents(messageItem, messageId) {
        const uploadArea = messageItem.querySelector('.audio-upload-area');
        const fileInput = messageItem.querySelector('.audio-file-input');
        
        // Botón de seleccionar archivo
        const selectBtn = uploadArea.querySelector('.select-audio-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Botón de cambiar audio
        const changeBtn = uploadArea.querySelector('.change-audio-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Botón de eliminar audio
        const removeBtn = uploadArea.querySelector('.remove-audio-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeAudio(messageId, uploadArea);
            });
        }
        
        // Cambio de archivo
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAudioFileUpload(messageId, e.target.files[0], uploadArea);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleAudioFileUpload(messageId, files[0], uploadArea);
            }
        });
    }

    // Manejar carga de archivo de audio
    async handleAudioFileUpload(messageId, file, uploadArea) {
        try {
            // Mostrar loading
            uploadArea.innerHTML = `
                <div class="audio-loading">
                    <div class="loading-spinner"></div>
                    <div>Procesando audio...</div>
                </div>
            `;
            
            // Debug: mostrar información del archivo
            console.log('Archivo seleccionado:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
            
            // Procesar archivo
            await this.messageManager.handleAudioFile(messageId, file);
            
            // Actualizar interfaz
            const message = this.messageManager.getMessage(messageId);
            uploadArea.innerHTML = this.createAudioUploadInterface(message);
            this.setupAudioUploadEvents(uploadArea.closest('.message-item'), messageId);
            
            // Agregar vista previa
            const voiceConfig = uploadArea.closest('.voice-config-content');
            let previewContainer = voiceConfig.querySelector('.audio-preview');
            if (previewContainer) {
                previewContainer.remove();
            }
            
            voiceConfig.insertAdjacentHTML('beforeend', this.createAudioPreview(message));
            this.setupPreviewPlayback(voiceConfig.querySelector('.preview-play-btn'));
            
            this.uiController.showNotification('✅ Audio cargado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al cargar audio:', error);
            this.uiController.showNotification('❌ Error: ' + error.message, 'error');
            
            // Restaurar interfaz
            const message = this.messageManager.getMessage(messageId);
            uploadArea.innerHTML = this.createAudioUploadInterface(message);
            this.setupAudioUploadEvents(uploadArea.closest('.message-item'), messageId);
        }
    }

    // Eliminar audio de mensaje
    removeAudio(messageId, uploadArea) {
        const message = this.messageManager.getMessage(messageId);
        if (message) {
            message.audioData = null;
            message.audioFileName = null;
            message.duration = 0;
            
            // Actualizar interfaz
            uploadArea.innerHTML = this.createAudioUploadInterface(message);
            this.setupAudioUploadEvents(uploadArea.closest('.message-item'), messageId);
            
            // Eliminar vista previa
            const preview = uploadArea.closest('.voice-config-content').querySelector('.audio-preview');
            if (preview) {
                preview.remove();
            }
            
            this.uiController.showNotification('🗑️ Audio eliminado', 'info');
        }
    }

    // Configurar reproducción de vista previa
    setupPreviewPlayback(playBtn) {
        if (!playBtn) return;
        
        let audio = null;
        let isPlaying = false;
        
        playBtn.addEventListener('click', () => {
            const audioData = playBtn.dataset.audioData;
            
            if (!audio) {
                audio = new Audio(audioData);
                
                audio.addEventListener('ended', () => {
                    isPlaying = false;
                    playBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    `;
                });
            }
            
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                playBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                `;
            } else {
                audio.play();
                isPlaying = true;
                playBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                `;
            }
        });
    }

    // Formatear duración
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}