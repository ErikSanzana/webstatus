# Guía para Configurar Cloudflare Worker como Proxy

## ¿Por qué necesitamos un Worker?

Los servicios de Skinsback y CoinPaid bloquean peticiones directas desde el navegador (CORS) y desde proxies públicos (error 403). La solución es crear tu propio Cloudflare Worker que:
- Se ejecute desde los servidores de Cloudflare (no es detectado como proxy público)
- Tenga headers de navegador real
- Soporte CORS para tu sitio
- Sea GRATIS (100,000 requests/día en el plan gratuito)

## Paso 1: Instalar Wrangler CLI

```bash
# Instalar Wrangler (si no lo tienes)
npm install -g wrangler

# Verificar instalación
wrangler --version
```

## Paso 2: Iniciar sesión en Cloudflare

```bash
# Iniciar sesión (abrirá el navegador)
wrangler login
```

## Paso 3: Crear el Worker

```bash
# Navegar a tu carpeta del proyecto
cd C:\Users\home\Desktop\pythons\WEBSTATUS

# Crear el Worker
wrangler deploy worker.js
```

Esto desplegará el Worker y te dará una URL como:
`https://payment-proxy.tu-subdominio.workers.dev`

## Paso 4: Obtener la URL del Worker

El comando anterior te mostrará algo como:
```
✨ Successfully published your Worker to
  https://payment-proxy.ersanzana.workers.dev
```

Copia esa URL.

## Paso 5: Actualizar script.js con la URL del Worker

Abre `script.js` y modifica la línea 4:

```javascript
// ANTES:
const PROXY_URL = 'https://corsproxy.io/?';

// DESPUÉS (reemplaza con tu URL real):
const PROXY_URL = 'https://payment-proxy.ersanzana.workers.dev?url=';
```

## Paso 6: Verificar que funciona

1. Abre `index.html` en tu navegador
2. Verifica que Skinsback y CoinPaid ahora funcionen sin error 403

## Paso 7: Subir los cambios a GitHub

```bash
cd C:\Users\home\Desktop\pythons\WEBSTATUS

git add .
git commit -m "Add Cloudflare Worker as proxy for payment gateways"
git push
```

## Método Alternativo: Desde el panel de Cloudflare

Si prefieres usar la interfaz web:

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. En el menú lateral, haz clic en **"Workers & Pages"**
3. Haz clic en **"Create application"**
4. Selecciona **"Create Worker"**
5. Dale un nombre: `payment-proxy`
6. Haz clic en **"Deploy"**
7. Haz clic en **"Edit code"**
8. Reemplaza el código con el contenido de `worker.js`
9. Haz clic en **"Deploy"**
10. Copia la URL del Worker
11. Actualiza `script.js` con esa URL

## Prueba del Worker

Puedes probar tu Worker directamente en el navegador:

```
https://payment-proxy.tu-subdominio.workers.dev?url=https://skinsback.com
```

Deberías ver el contenido de skinsback.com sin errores.

## Solución de problemas

### Error: "Authentication failed"

```bash
# Cierra sesión y vuelve a iniciar
wrangler logout
wrangler login
```

### Error: "Worker script exceeded quota"

El plan gratuito tiene 100,000 requests/día. Si excedes este límite:
- Espera a que se renueve el límite (diario)
- O actualiza a un plan de pago (no necesario para este proyecto)

### El Worker no responde

1. Verifica que el código de `worker.js` sea correcto
2. Revisa los logs en el panel de Cloudflare
3. Prueba la URL del Worker directamente en el navegador

### Error CORS persiste

Verifica que:
1. La URL del Worker sea correcta en `script.js`
2. El Worker esté desplegado correctamente
3. Los headers CORS estén configurados en el Worker

## Ventajas del Cloudflare Worker

✅ **GRATIS** - 100,000 requests/día
✅ **Rápido** - Ejecución en edge de Cloudflare
✅ **No detectado** - No es un proxy público
✅ **Fácil** - Solo unas líneas de código
✅ **Escalable** - Maneja tráfico automáticamente
✅ **Global** - Distribuido mundialmente

## Archivos creados para el Worker

- `worker.js` - Código del Worker
- `wrangler.toml` - Configuración de despliegue
- `config.js` - Configuración de la URL del proxy (opcional)
- `WORKER_SETUP.md` - Esta guía

¡Una vez configurado, tu proxy funcionará de forma confiable sin los errores 403!