class WAFakeSimulator {
    constructor() {
        this.participants = {
            1: { name: 'Tú', avatar: 'assets/img/avatar-default.svg' },
            2: { name: 'Contacto', avatar: 'assets/img/avatar-default.svg' }
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
        this.messageManager.updateMessage(id, field, value);
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