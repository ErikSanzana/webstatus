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
        url: 'https://corsproxy.io/?' + encodeURIComponent('https://skinsback.com'),
        type: 'http'
    },
    {
        name: 'CoinPaid',
        url: 'https://corsproxy.io/?' + encodeURIComponent('https://app.cryptoprocessing.com/api/v2/ping'),
        type: 'http'
    }
];

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

async function checkService(service) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(service.url, {
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
                description: description || 'Estado desconocido',
                responseTime: performance.now()
            };
        } else if (service.type === 'components') {
            const data = await response.json();
            const components = data.components || [];
            const webpayComponents = components.filter(c => c.name.includes('Webpay'));
            
            if (webpayComponents.length === 0) {
                return {
                    name: service.name,
                    status: 'error',
                    description: 'No encontrado',
                    responseTime: performance.now()
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
                details: statuses,
                responseTime: performance.now()
            };
        } else if (service.type === 'http') {
            // Para servicios que usan proxy CORS, verificamos el contenido de la respuesta
            const text = await response.text();
            
            // Si el proxy funciona pero el servicio original falla
            if (response.ok && text.length > 0) {
                return {
                    name: service.name,
                    status: 'operational',
                    description: 'Activo',
                    responseTime: performance.now()
                };
            } else if (!response.ok) {
                return {
                    name: service.name,
                    status: 'major',
                    description: `HTTP ${response.status}`,
                    responseTime: performance.now()
                };
            } else {
                // Respuesta vacía del proxy
                return {
                    name: service.name,
                    status: 'minor',
                    description: 'No se pudo verificar (posible bloqueo del proxy)',
                    responseTime: performance.now()
                };
            }
        }
    } catch (error) {
        return {
            name: service.name,
            status: 'error',
            description: `Error: ${error.message}`,
            responseTime: performance.now()
        };
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

    const promises = services.map(service => checkService(service));
    const results = await Promise.all(promises);

    grid.innerHTML = '';
    results.forEach((service, index) => {
        const card = createServiceCard(service, index);
        grid.appendChild(card);
    });

    grid.classList.remove('loading');
    refreshBtn.disabled = false;

    updateLastUpdateTime();
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

document.addEventListener('DOMContentLoaded', () => {
    updateServices();
    setupRefreshButton();
    setupAutoRefresh();
});