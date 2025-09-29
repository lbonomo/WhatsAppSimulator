# WAFake - Simulador de Chat W### 2. Configurar Mensajes
- Cada mensaje tiene:
  - **Autor**: Selecciona cuál de los 2 participantes envía el mensaje
  - **Texto**: El contenido del mensaje
  - **Delay**: Tiempo en milisegundos antes de mostrar el mensaje

### 3. Gestión de Mensajesmulador de chat de WhatsApp que permite crear conversaciones falsas con animaciones realistas y panel de control completo.

## Características

✅ **Panel de Control Completo**
- Configuración de 2 participantes: Local (derecha/verde) y Remoto (izquierda/blanco)
- Gestión de mensajes con cantidad variable
- Control de autor de cada mensaje
- Configuración de delays entre mensajes

✅ **Chat Realista**
- Interfaz similar a WhatsApp
- Animación de "escribiendo..." típica
- Mensajes con burbujas y avatares
- Timestamps automáticos
- Efectos de sonido opcionales

✅ **Controles de Simulación**
- Iniciar/Detener simulación
- Reiniciar conversación
- Agregar/Eliminar mensajes dinámicamente

## Instrucciones de Uso

### 1. Configurar Participantes
- **Local (Derecha)**: Mensajes que aparecen con fondo verde a la derecha del chat
- **Remoto (Izquierda)**: Mensajes que aparecen con fondo blanco a la izquierda del chat
- Configura nombres y avatares para ambos participantes

### 2. Configurar Mensajes
- Cada mensaje tiene:
  - **Autor**: Selecciona entre Local (derecha/verde) o Remoto (izquierda/blanco)
  - **Texto**: El contenido del mensaje (soporta saltos de línea)
  - **Delay**: Tiempo en milisegundos antes de mostrar el mensaje

### 3. Gestión de Mensajes
- **Agregar**: Usa el botón "Agregar Mensaje" para añadir nuevos mensajes
- **Eliminar**: Cada mensaje tiene un botón "Eliminar" 
- **Editar**: Modifica el texto, autor o delay directamente

### 4. Ejecutar Simulación
- **Iniciar**: Presiona "Iniciar Simulación" para comenzar
- **Detener**: Para la simulación en cualquier momento
- **Reiniciar**: Limpia el chat y vuelve al inicio

## Estructura del Proyecto

```
WAFake/
├── index.html          # Página principal con la interfaz
├── styles.css          # Estilos CSS con diseño de WhatsApp
├── script.js           # Lógica JavaScript del simulador
├── assets/
│   └── img/
│       ├── avatar-local.svg    # Avatar por defecto para participante local
│       ├── avatar-remoto.svg   # Avatar por defecto para participante remoto
│       ├── avatar-default.svg  # Avatar genérico por defecto
│       └── avatar-typing.svg   # Avatar pequeño para indicador
└── README.md           # Este archivo
```

## Características Técnicas

### Animaciones
- Efecto "escribiendo" con puntos animados
- Aparición suave de mensajes
- Scroll automático al final de la conversación

### Responsive Design
- Adaptable a diferentes tamaños de pantalla
- Panel de control colapsable en móviles

### Configuración Avanzada
- **Avatares locales**: Se incluyen avatares SVG por defecto que funcionan sin conexión
- **Avatares personalizados**: Puedes agregar URLs de imágenes externas
- **Colores y estilos**: Similares a WhatsApp
- **Timestamps**: Automáticos con hora actual
- **Saltos de línea**: Los mensajes respetan los saltos de línea (\n)
- Avatares automáticos generados si no se especifica URL
- Colores y estilos similares a WhatsApp
- Timestamps automáticos con hora actual

## Uso Avanzado

### Delays Recomendados
- **Mensajes cortos**: 1000-2000ms
- **Mensajes largos**: 2000-4000ms
- **Respuestas rápidas**: 500-1000ms
- **Pausas dramáticas**: 5000ms+

### Tips para Conversaciones Realistas
1. Varía los tiempos de respuesta
2. Alterna entre los participantes
3. Usa emojis y texto natural
4. Simula errores de escritura ocasionales

## Navegadores Compatibles
- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Instalación

1. Descarga o clona este repositorio
2. Abre `index.html` en tu navegador
3. ¡Comienza a crear tus conversaciones!

No requiere servidor web ni instalación adicional.

---

**Nota**: Este es un simulador educativo/de entretenimiento. No envía mensajes reales ni se conecta a servicios de WhatsApp.