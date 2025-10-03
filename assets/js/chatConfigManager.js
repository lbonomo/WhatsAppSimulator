class ChatConfigManager {
    constructor() {
        this.config = {
            fontSize: 14,
            localAvatar: null,
            contactAvatar: null
        };
        this.loadConfig();
        this.setupEventListeners();
    }

    // Cargar configuración desde localStorage
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('whatsapp-simulator-chat-config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.warn('Error loading chat config from localStorage:', error);
        }
        
        // Asegurar que siempre hay valores por defecto
        if (!this.config.localAvatar) {
            this.config.localAvatar = null;
        }
        if (!this.config.contactAvatar) {
            this.config.contactAvatar = null;
        }
        
        this.applyConfig();
    }

    // Guardar configuración en localStorage
    saveConfig() {
        try {
            localStorage.setItem('whatsapp-simulator-chat-config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Error saving chat config to localStorage:', error);
        }
    }

    // Aplicar la configuración actual
    applyConfig() {
        // Aplicar tamaño de fuente
        this.applyFontSize(this.config.fontSize);
        
        // Aplicar avatares (usar configurados o defaults)
        this.applyLocalAvatar(this.getLocalAvatar());
        this.applyContactAvatar(this.getContactAvatar());

        // Actualizar controles UI
        this.updateUIControls();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Control de tamaño de fuente
        const fontSizeSlider = document.getElementById('font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const fontSize = parseInt(e.target.value);
                this.setFontSize(fontSize);
            });
        }

        // Avatar local
        const localAvatarBtn = document.getElementById('local-avatar-btn');
        const localAvatarUpload = document.getElementById('local-avatar-upload');
        const localAvatarReset = document.getElementById('local-avatar-reset');

        if (localAvatarBtn && localAvatarUpload) {
            localAvatarBtn.addEventListener('click', () => localAvatarUpload.click());
            localAvatarUpload.addEventListener('change', (e) => this.handleLocalAvatarUpload(e));
        }
        
        if (localAvatarReset) {
            localAvatarReset.addEventListener('click', () => this.resetLocalAvatar());
        }

        // Avatar contacto
        const contactAvatarBtn = document.getElementById('contact-avatar-btn');
        const contactAvatarUpload = document.getElementById('contact-avatar-upload');
        const contactAvatarReset = document.getElementById('contact-avatar-reset');

        if (contactAvatarBtn && contactAvatarUpload) {
            contactAvatarBtn.addEventListener('click', () => contactAvatarUpload.click());
            contactAvatarUpload.addEventListener('change', (e) => this.handleContactAvatarUpload(e));
        }

        if (contactAvatarReset) {
            contactAvatarReset.addEventListener('click', () => this.resetContactAvatar());
        }
    }

    // Establecer tamaño de fuente
    setFontSize(fontSize) {
        this.config.fontSize = fontSize;
        this.applyFontSize(fontSize);
        this.saveConfig();
    }

    // Aplicar tamaño de fuente al chat
    applyFontSize(fontSize) {
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
            chatContainer.style.fontSize = `${fontSize}px`;
        }

        // Forzar el tamaño en todos los mensajes existentes
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => {
            message.style.fontSize = `${fontSize}px`;
        });

        // Actualizar el display del valor
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeValue) {
            fontSizeValue.textContent = `${fontSize}px`;
        }
    }

    // Manejar subida de avatar local
    async handleLocalAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const dataUrl = await this.fileToDataUrl(file);
                this.setLocalAvatar(dataUrl);
            } catch (error) {
                console.error('Error uploading local avatar:', error);
                alert('Error al subir la imagen. Por favor, intenta con una imagen más pequeña.');
            }
        }
    }

    // Manejar subida de avatar contacto
    async handleContactAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const dataUrl = await this.fileToDataUrl(file);
                this.setContactAvatar(dataUrl);
            } catch (error) {
                console.error('Error uploading contact avatar:', error);
                alert('Error al subir la imagen. Por favor, intenta con una imagen más pequeña.');
            }
        }
    }

    // Convertir archivo a Data URL
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            // Validar tamaño del archivo (máximo 1MB)
            if (file.size > 1024 * 1024) {
                reject(new Error('La imagen es demasiado grande. Máximo 1MB.'));
                return;
            }

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                reject(new Error('Solo se permiten archivos de imagen.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    // Establecer avatar local
    setLocalAvatar(dataUrl) {
        this.config.localAvatar = dataUrl;
        this.applyLocalAvatar(dataUrl);
        this.saveConfig();
    }

    // Aplicar avatar local
    applyLocalAvatar(dataUrl) {
        const preview = document.getElementById('local-avatar-preview');
        if (preview) {
            preview.src = dataUrl;
        }

        // También actualizar el avatar en mensajes de voz enviados
        const chatAvatars = document.querySelectorAll('.message.sent .voice-avatar img');
        chatAvatars.forEach(avatar => {
            avatar.src = dataUrl;
        });
    }

    // Establecer avatar contacto
    setContactAvatar(dataUrl) {
        this.config.contactAvatar = dataUrl;
        this.applyContactAvatar(dataUrl);
        this.saveConfig();
    }

    // Aplicar avatar contacto
    applyContactAvatar(dataUrl) {
        const preview = document.getElementById('contact-avatar-preview');
        if (preview) {
            preview.src = dataUrl;
        }

        // También actualizar el avatar en el chat header
        const chatHeaderAvatar = document.getElementById('chat-contact-avatar');
        if (chatHeaderAvatar) {
            chatHeaderAvatar.src = dataUrl;
        }

        // Y en los mensajes de voz recibidos
        const chatAvatars = document.querySelectorAll('.message.received .voice-avatar img');
        chatAvatars.forEach(avatar => {
            avatar.src = dataUrl;
        });
    }

    // Resetear avatar local
    resetLocalAvatar() {
        this.config.localAvatar = null;
        this.applyLocalAvatar(this.getLocalAvatar());
        this.saveConfig();
    }

    // Resetear avatar contacto
    resetContactAvatar() {
        this.config.contactAvatar = null;
        this.applyContactAvatar(this.getContactAvatar());
        this.saveConfig();
    }

    // Actualizar controles de la UI con los valores actuales
    updateUIControls() {
        // Slider de tamaño de fuente
        const fontSizeSlider = document.getElementById('font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.value = this.config.fontSize;
        }

        // Valor del tamaño de fuente
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeValue) {
            fontSizeValue.textContent = `${this.config.fontSize}px`;
        }

        // Previews de avatares
        const localPreview = document.getElementById('local-avatar-preview');
        if (localPreview) {
            localPreview.src = this.getLocalAvatar();
        }

        const contactPreview = document.getElementById('contact-avatar-preview');
        if (contactPreview) {
            contactPreview.src = this.getContactAvatar();
        }
    }

    // Obtener la configuración actual
    getConfig() {
        return { ...this.config };
    }

    // Obtener avatares para usar en el simulador
    getAvatars() {
        return {
            local: this.getLocalAvatar(),
            contact: this.getContactAvatar()
        };
    }

    // Obtener avatar local con fallback
    getLocalAvatar() {
        return this.config.localAvatar || 'assets/img/avatar-default.svg';
    }

    // Obtener avatar contacto con fallback
    getContactAvatar() {
        return this.config.contactAvatar || 'assets/img/avatar-default.svg';
    }
}