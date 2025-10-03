class WAFakeSimulator {
    constructor() {
        // Inicializar configuración de chat primero
        this.chatConfigManager = new ChatConfigManager();
        
        // Obtener avatares de la configuración
        const avatars = this.chatConfigManager.getAvatars();
        
        this.participants = {
            1: { name: 'Tú', avatar: avatars.local },
            2: { name: 'Contacto', avatar: avatars.contact }
        };
        
        // Inicializar módulos
        this.linkPreviewManager = new LinkPreviewManager();
        this.messageManager = new MessageManager();
        this.uiController = new UIController(this.participants, this.linkPreviewManager);
        this.voiceMessageManager = new VoiceMessageManager(this.messageManager, this.uiController);
        this.simulationEngine = new SimulationEngine(
            this.messageManager, 
            this.uiController, 
            this.linkPreviewManager
        );
        this.configManager = new ConfigManager(this);
        
        this.init();
    }

    init() {
        this.uiController.setupEventListeners(this);
        this.messageManager.addDefaultMessages();
        this.uiController.updateChatHeader();
        this.renderMessageConfigs();
        
        // Configurar listener para cambios en avatares
        this.setupAvatarListeners();
    }

    // Configurar listeners para cambios de avatar
    setupAvatarListeners() {
        // Cuando se cambie el avatar del contacto, actualizar participantes y UI
        const originalApplyContactAvatar = this.chatConfigManager.applyContactAvatar.bind(this.chatConfigManager);
        this.chatConfigManager.applyContactAvatar = (dataUrl) => {
            originalApplyContactAvatar(dataUrl);
            this.participants[2].avatar = dataUrl;
            this.uiController.updateChatHeader();
            // Actualizar mensajes existentes del contacto
            this.updateExistingContactMessages(dataUrl);
        };

        // Cuando se cambie el avatar local, actualizar participantes
        const originalApplyLocalAvatar = this.chatConfigManager.applyLocalAvatar.bind(this.chatConfigManager);
        this.chatConfigManager.applyLocalAvatar = (dataUrl) => {
            originalApplyLocalAvatar(dataUrl);
            this.participants[1].avatar = dataUrl;
            // Actualizar mensajes existentes del usuario local
            this.updateExistingLocalMessages(dataUrl);
        };
    }

    // Actualizar avatares en mensajes existentes del contacto
    updateExistingContactMessages(avatarUrl) {
        const contactMessages = document.querySelectorAll('.message.received .voice-avatar img');
        contactMessages.forEach(img => {
            img.src = avatarUrl;
        });
    }

    // Actualizar avatares en mensajes existentes del usuario local
    updateExistingLocalMessages(avatarUrl) {
        const localMessages = document.querySelectorAll('.message.sent .voice-avatar img');
        localMessages.forEach(img => {
            img.src = avatarUrl;
        });
    }

    // Métodos que actúan como bridge entre la UI y los módulos
    addMessage() {
        this.messageManager.addMessage('text');
        this.renderMessageConfigs();
    }

    addVoiceMessage() {
        this.messageManager.addMessage('voice');
        this.renderMessageConfigs();
    }

    updateMessage(id, field, value) {
        console.log(`Updating message ${id}: ${field} = ${value}`); // Debug
        
        // Obtener el valor anterior para comparar
        const message = this.messageManager.getMessage(id);
        const oldValue = message ? message[field] : undefined;
        
        this.messageManager.updateMessage(id, field, value);
        
        // Solo re-renderizar si el valor realmente cambió y es replyToId
        if (field === 'replyToId' && oldValue !== (value === '' ? null : value)) {
            console.log('Re-rendering configs due to replyToId change'); // Debug
            this.renderMessageConfigs();
        }
    }

    deleteMessage(id) {
        this.messageManager.deleteMessage(id);
        this.renderMessageConfigs();
        if (this.simulationEngine.isRunning()) {
            this.simulationEngine.stopSimulation();
        }
    }

    renderMessageConfigs() {
        this.messageManager.renderMessageConfigs(this.participants, this.voiceMessageManager);
    }

    startSimulation() {
        this.simulationEngine.startSimulation();
    }

    stopSimulation() {
        this.simulationEngine.stopSimulation();
    }

    resetSimulation() {
        this.simulationEngine.resetSimulation();
    }

    // Método para renderizar mensajes (opcional, para compatibilidad)
    renderMessages() {
        // Este método se puede usar para mostrar una vista previa de los mensajes configurados
        // Por ahora, simplemente re-renderiza la configuración
        this.renderMessageConfigs();
    }

    // Métodos de configuración
    saveConfig() {
        this.configManager.downloadConfig();
    }

    loadConfig() {
        this.configManager.loadConfigFromFile();
    }

    downloadSampleConfig() {
        this.configManager.downloadSampleConfig();
    }

    exportConfig() {
        return this.configManager.exportConfig();
    }

    importConfig(config) {
        return this.configManager.importConfig(config);
    }

    // Getters para acceso a los módulos si es necesario
    getMessageManager() {
        return this.messageManager;
    }

    getUIController() {
        return this.uiController;
    }

    getSimulationEngine() {
        return this.simulationEngine;
    }

    getLinkPreviewManager() {
        return this.linkPreviewManager;
    }

    getConfigManager() {
        return this.configManager;
    }
}