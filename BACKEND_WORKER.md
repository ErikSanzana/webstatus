# Mover Lógica Crítica a Cloudflare Workers

## 🎯 Objetivo

Proteger tu código moviendo la lógica de consulta de APIs a Cloudflare Workers. El frontend solo recibirá los resultados, sin ver cómo se obtienen.

## 📐 Arquitectura

### Actual (Frontend expuesto):
```
Navegador → Consulta APIs directamente → Código visible
```

### Nueva (Backend protegido):
```
Navegador → Cloudflare Worker → Consulta APIs → Código protegido
```

## 🚀 Paso 1: Crear el Cloudflare Worker

### 1.1 Crear archivo `worker.js`

```javascript
// worker.js - Código protegido en Cloudflare
export default {
  async fetch(request, env, ctx) {
    // Configuración de CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Manejar preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Lista de proxies CORS (solo el Worker los usa)
      const corsProxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/'
      ];

      // Servicios a monitorear
      const services = [
        {
          name: 'AstroPay',
          url: 'https://status.astropay.com/api/v2/status.json',
          type: 'statuspage'
        },
        {
          name: 'Kushki',
          url: 'https://status.kushkipagos.com/api/v2/status.json',
          type: 'statuspage'
        },
        {
          name: 'WebPay',
          url: 'https://status.transbankdevelopers.cl/api/v2/components.json',
          type: 'components'
        },
        {
          name: 'MACH',
          url: 'https://mach.statuspage.io/api/v2/status.json',
          type: 'statuspage'
        },
        {
          name: 'MercadoPago',
          url: 'https://mercadopago.statuspage.io/api/v2/status.json',
          type: 'statuspage'
        },
        {
          name: 'Skinsback',
          originalUrl: 'https://skinsback.com',
          type: 'http',
          useProxy: true
        },
        {
          name: 'CoinPaid',
          originalUrl: 'https://app.cryptoprocessing.com/api/v2/ping',
          type: 'http',
          useProxy: true
        }
      ];

      // Función para probar proxies (protegida)
      async function getWorkingProxy(targetUrl) {
        for (const proxy of corsProxies) {
          try {
            const proxyUrl = proxy + encodeURIComponent(targetUrl);
            const response = await fetch(proxyUrl, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 200) {
              return proxy;
            }
          } catch (e) {
            continue;
          }
        }
        return corsProxies[0];
      }

      // Mapa de estados
      const statusMap = {
        none: 'operational',
        minor: 'minor',
        major: 'major',
        critical: 'critical',
        maintenance: 'maintenance',
        operational: 'operational',
        degraded_performance: 'minor',
        partial_outage: 'major',
        major_outage: 'critical'
      };

      const statusLabels = {
        operational: 'Operativo',
        minor: 'Problemas menores',
        major: 'Problemas mayores',
        critical: 'Crítico',
        maintenance: 'Mantenimiento',
        error: 'Error'
      };

      // Función para verificar servicios (protegida)
      async function checkService(service) {
        try {
          let targetUrl = service.url;
          
          if (service.useProxy && service.originalUrl) {
            const workingProxy = await getWorkingProxy(service.originalUrl);
            targetUrl = workingProxy + encodeURIComponent(service.originalUrl);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(targetUrl, {
            signal: controller.signal,
            mode: 'cors'
          });
          clearTimeout(timeoutId);

          if (service.type === 'statuspage') {
            const data = await response.json();
            const indicator = data.status?.indicator;
            const description = data.status?.description;
            
            return {
              name: service.name,
              status: statusMap[indicator] || 'error',
              description: description || 'Estado desconocido'
            };
          } else if (service.type === 'components') {
            const data = await response.json();
            const components = data.components || [];
            const webpayComponents = components.filter(c => c.name.includes('Webpay'));
            
            if (webpayComponents.length === 0) {
              return {
                name: service.name,
                status: 'error',
                description: 'No encontrado'
              };
            }

            const statuses = webpayComponents.map(comp => ({
              name: comp.name,
              status: statusMap[comp.status] || 'error'
            }));

            const overallStatus = statuses.some(s => s.status === 'critical') ? 'critical' :
                                  statuses.some(s => s.status === 'major') ? 'major' :
                                  statuses.some(s => s.status === 'minor') ? 'minor' : 'operational';

            return {
              name: service.name,
              status: overallStatus,
              description: statuses.map(s => `${s.name}: ${statusLabels[s.status]}`).join(', '),
              details: statuses
            };
          } else if (service.type === 'http') {
            const text = await response.text();
            
            if (response.ok && text.length > 0) {
              return {
                name: service.name,
                status: 'operational',
                description: 'Activo'
              };
            } else if (!response.ok) {
              return {
                name: service.name,
                status: 'major',
                description: `HTTP ${response.status}`
              };
            } else {
              if (service.useProxy && service.originalUrl) {
                const proxyIndex = corsProxies.findIndex(p => targetUrl.includes(p));
                if (proxyIndex < corsProxies.length - 1) {
                  const nextProxy = corsProxies[proxyIndex + 1];
                  const nextUrl = nextProxy + encodeURIComponent(service.originalUrl);
                  
                  try {
                    const retryResponse = await fetch(nextUrl, {
                      signal: AbortSignal.timeout(10000),
                      mode: 'cors'
                    });
                    const retryText = await retryResponse.text();
                    
                    if (retryResponse.ok && retryText.length > 0) {
                      return {
                        name: service.name,
                        status: 'operational',
                        description: 'Activo'
                      };
                    }
                  } catch (retryError) {
                    // Continuar con error original
                  }
                }
              }
              
              return {
                name: service.name,
                status: 'minor',
                description: 'No se pudo verificar (todos los proxies fallaron)'
              };
            }
          }
        } catch (error) {
          return {
            name: service.name,
            status: 'error',
            description: `Error: ${error.message}`
          };
        }
      }

      // Verificar todos los servicios
      const results = await Promise.all(services.map(service => checkService(service)));

      // Respuesta con los resultados
      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        services: results
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
```

### 1.2 Crear archivo `wrangler.toml`

```toml
name = "payment-status-worker"
main = "worker.js"
compatibility_date = "2024-01-01"
```

## 🚀 Paso 2: Desplegar el Worker

### 2.1 Instalar Wrangler

```bash
npm install -g wrangler
```

### 2.2 Iniciar sesión

```bash
wrangler login
```

### 2.3 Desplegar

```bash
cd C:\Users\home\Desktop\pythons\WEBSTATUS
wrangler deploy worker.js
```

### 2.4 Obtener la URL

Wrangler te dará una URL como:
```
https://payment-status-worker.tu-subdominio.workers.dev
```

Copia esta URL.

## 🚀 Paso 3: Modificar el Frontend

### 3.1 Actualizar `script.js`

Reemplaza todo el contenido de `script.js` con:

```javascript
/**
 * Copyright (c) 2024 Erik Sanzana
 * Email: ersanzana@gmail.com
 * 
 * Monitoreo de Pasarelas de Pago
 * Todos los derechos reservados
 * 
 * Prohibida la copia, distribución o modificación
 * sin autorización escrita del autor.
 */

// URL del Cloudflare Worker (reemplaza con tu URL real)
const WORKER_URL = 'https://payment-status-worker.tu-subdominio.workers.dev';

const statusLabels = {
    operational: 'Operativo',
    minor: 'Problemas menores',
    major: 'Problemas mayores',
    critical: 'Crítico',
    maintenance: 'Mantenimiento',
    error: 'Error'
};

async function fetchServicesStatus() {
    try {
        const response = await fetch(WORKER_URL);
        const data = await response.json();
        
        if (data.success) {
            return data.services;
        } else {
            throw new Error(data.error || 'Error al obtener estado');
        }
    } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
    }
}

function createServiceCard(service, index) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const statusClass = service.status;
    const statusLabel = statusLabels[service.status] || 'Desconocido';

    card.innerHTML = `
        <div class="service-header">
            <h3 class="service-name">${service.name}</h3>
            <div class="service-status">
                <span class="status-indicator ${statusClass}"></span>
                <span class="status-text ${statusClass}">${statusLabel}</span>
            </div>
        </div>
        <p class="service-description">${service.description}</p>
        ${service.details ? `
            <div class="service-details">
                ${service.details.map(detail => `
                    <div class="service-detail-item">
                        <span class="status-indicator ${detail.status}" style="width: 8px; height: 8px;"></span>
                        <span>${detail.name}: ${statusLabels[detail.status]}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    return card;
}

async function updateServices() {
    const grid = document.getElementById('servicesGrid');
    const refreshBtn = document.getElementById('refreshBtn');
    
    grid.classList.add('loading');
    refreshBtn.disabled = true;

    try {
        const services = await fetchServicesStatus();
        
        grid.innerHTML = '';
        services.forEach((service, index) => {
            const card = createServiceCard(service, index);
            grid.appendChild(card);
        });

        updateLastUpdateTime();
    } catch (error) {
        grid.innerHTML = `
            <div class="service-card" style="grid-column: 1 / -1; text-align: center;">
                <h3 class="service-name">Error al cargar servicios</h3>
                <p class="service-description">${error.message}</p>
                <p class="service-description">Intenta recargar la página</p>
            </div>
        `;
    }

    grid.classList.remove('loading');
    refreshBtn.disabled = false;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

let autoRefreshInterval;

function setupAutoRefresh() {
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    
    function clearExistingInterval() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    function startAutoRefresh() {
        clearExistingInterval();
        autoRefreshInterval = setInterval(updateServices, 30000);
    }

    autoRefreshCheckbox.addEventListener('change', () => {
        if (autoRefreshCheckbox.checked) {
            startAutoRefresh();
        } else {
            clearExistingInterval();
        }
    });

    if (autoRefreshCheckbox.checked) {
        startAutoRefresh();
    }
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', updateServices);
}

// Crear estrellas animadas aleatorias
function createStars() {
    const starsContainer = document.getElementById('starsLarge');
    if (!starsContainer) return;

    const numberOfStars = 50;
    
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 3;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createStars();
    updateServices();
    setupRefreshButton();
    setupAutoRefresh();
});
```

## 🚀 Paso 4: Probar y Subir

### 4.1 Probar localmente

```bash
# Abre index.html en tu navegador
# Verifica que funcione con el Worker
```

### 4.2 Subir a GitHub

```bash
cd C:\Users\home\Desktop\pythons\WEBSTATUS
git add .
git commit -m "Move API logic to Cloudflare Worker for code protection"
git push
```

## ✅ Beneficios

### Código Protegido
- ✅ Lógica de APIs no visible en frontend
- ✅ Proxies CORS ocultos
- ✅ Manejo de errores protegido
- ✅ Solo visible el resultado final

### Ventajas Técnicas
- ✅ Más rápido (caching en Cloudflare)
- ✅ Rate limiting disponible
- ✅ Logs y monitoreo
- ✅ Global CDN

### Gratis
- ✅ 100,000 requests/día en plan gratuito
- ✅ Suficiente para tu uso

## 🔧 Opcional: Agregar Rate Limiting

Para proteger contra abuso:

```javascript
// En worker.js, agrega antes de la lógica principal
const rateLimit = {
  // Simple rate limiting por IP
  async check(request) {
    const ip = request.headers.get('CF-Connecting-IP');
    // Implementar lógica de rate limiting
    return true; // o false si excede límite
  }
};
```

## 🎯 Resumen

1. **Crear worker.js** con toda la lógica de APIs
2. **Desplegar con Wrangler**
3. **Obtener URL del Worker**
4. **Actualizar script.js** para usar el Worker
5. **Probar y subir a GitHub**

Ahora tu código crítico está protegido en Cloudflare Workers.