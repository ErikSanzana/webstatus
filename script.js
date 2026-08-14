/**
 * Copyright (c) 2024 Erik Sanzana
 * Email: ersanzana@gmail.com
 * 
 * Monitoreo de Pasarelas de Pago
 * Todos los derechos reservados
 * 
 * Prohibida la copia, distribución o modificación
 * sin autorización escrita del autor.
 * 
 * Versión frontend - Se conecta a Cloudflare Worker
 */

// URL del Cloudflare Worker (reemplaza con tu URL real después de desplegar)
const WORKER_URL = 'https://payment-status-worker.ersanzana.workers.dev';

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