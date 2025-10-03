class LinkPreviewManager {
    constructor() {
        this.linkCache = new Map(); // Cache para evitar múltiples requests
        this.imageCache = new Map(); // Cache específico para imágenes de OG
    }

    // Detectar URLs en el texto
    extractUrl(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);
        return urls ? urls[0] : null; // Retorna la primera URL encontrada
    }

    // Obtener datos de OG desde cache si está disponible
    getCachedOGData(url) {
        return this.linkCache.get(url);
    }

    // Verificar si una imagen de OG está en cache
    getCachedOGImage(url) {
        return this.imageCache.get(url);
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
                        
                        // Si hay imagen, también guardarla en el cache de imágenes
                        if (data.image) {
                            this.imageCache.set(url, data.image);
                        }
                        
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

    // Crear HTML para la vista previa del enlace
    createLinkPreview(ogData) {
        const isBasic = ogData.isBasic;
        const iconClass = isBasic ? 'basic-preview' : '';
        
        return `
            <div class="link-preview-inner ${iconClass}">
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
}