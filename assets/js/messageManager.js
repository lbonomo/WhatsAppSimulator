class MessageManager {
    constructor() {
        this.messages = [];
    }

    // Inicializar con mensajes por defecto
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
    }

    // Agregar un nuevo mensaje
    addMessage() {
        const newId = Math.max(...this.messages.map(m => m.id), 0) + 1;
        const newMessage = {
            id: newId,
            author: 1,
            text: '',
            delay: 2000
        };
        
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
        this.messages = this.messages.filter(m => m.id !== id);
    }

    // Obtener todos los mensajes
    getMessages() {
        return this.messages;
    }

    // Obtener un mensaje por ID
    getMessageById(id) {
        return this.messages.find(m => m.id === id);
    }

    // Renderizar la configuración de mensajes en la interfaz
    renderMessageConfigs(participants) {
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
                    <option value="2" ${message.author === 2 ? 'selected' : ''}>${participants[2].name} (mensaje blanco, izquierda)</option>
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
}