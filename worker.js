/**
 * Copyright (c) 2024 Erik Sanzana
 * Email: ersanzana@gmail.com
 * 
 * Cloudflare Worker para Monitoreo de Pasarelas de Pago
 * Todos los derechos reservados
 * 
 * Código protegido - Lógica de APIs y proxies
 */

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

          // Headers para simular navegador real
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          };

          const response = await fetch(targetUrl, {
            signal: controller.signal,
            mode: 'cors',
            headers: headers
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
                      mode: 'cors',
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                      }
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