# Guía Paso a Paso para Desplegar en Cloudflare Pages

## Paso 1: Preparar tu cuenta de Cloudflare

1. **Crear cuenta (si no tienes una)**
   - Ve a [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   - Completa el formulario de registro
   - Verifica tu correo electrónico

2. **Plan gratuito**
   - Cloudflare Pages tiene un plan gratuito que incluye:
     - Sitios ilimitados
     - 500 builds por mes
     - Ancho de banda ilimitado
     - Dominios personalizados

## Paso 2: Método 1 - Desplegar desde GitHub (Recomendado)

### 2.1 Conectar GitHub con Cloudflare

1. Inicia sesión en [dash.cloudflare.com](https://dash.cloudflare.com)
2. En el menú lateral, haz clic en **"Workers & Pages"**
3. Haz clic en **"Create application"**
4. Selecciona la pestaña **"Pages"**
5. Haz clic en **"Connect to Git"**

### 2.2 Autorizar Cloudflare

1. Si es la primera vez, Cloudflare te pedirá autorización
2. Haz clic en **"Authorize Cloudflare"** en la ventana de GitHub
3. Selecciona los repositorios que quieres conectar (o selecciona "All repositories")
4. Haz clic en **"Install & Authorize"**

### 2.3 Configurar el proyecto

1. **Seleccionar el repositorio**
   - En la lista de repositorios, busca `payment-gateways-status` (o el nombre que le diste)
   - Haz clic en **"Begin setup"**

2. **Configuración del build**
   - **Project name**: `payment-gateways-status` (puedes cambiarlo)
   - **Production branch**: `main`
   - **Framework preset**: `None` (este es un sitio estático)
   - **Build command**: (dejar vacío)
   - **Build output directory**: `.` (punto) o dejar vacío

3. **Variables de entorno** (opcional)
   - No necesitamos variables para este proyecto

4. **Hacer el deploy**
   - Haz clic en **"Save and Deploy"**
   - Espera a que termine el build (debería ser rápido, 30-60 segundos)
   - Verás un mensaje de éxito con tu URL

### 2.4 Verificar el despliegue

1. Cloudflare te dará una URL como:
   - `https://payment-gateways-status.pages.dev`
2. Haz clic en la URL para verificar que tu sitio funciona
3. También puedes encontrar la URL en:
   - Workers & Pages → Tu proyecto → Custom domains

## Paso 3: Método 2 - Desplegar con Wrangler CLI

### 3.1 Instalar Node.js (si no lo tienes)

1. Ve a [nodejs.org](https://nodejs.org)
2. Descarga e instala la versión LTS
3. Verifica la instalación:
   ```bash
   node --version
   npm --version
   ```

### 3.2 Instalar Wrangler

```bash
# Instalar Wrangler globalmente
npm install -g wrangler

# Verificar la instalación
wrangler --version
```

### 3.3 Iniciar sesión en Cloudflare

```bash
# Iniciar sesión
wrangler login
```

Esto abrirá tu navegador para autorizar a Wrangler.

### 3.4 Crear el proyecto

```bash
# Navegar a tu carpeta del proyecto
cd C:\Users\home\Desktop\pythons\WEBSTATUS

# Crear el proyecto en Cloudflare Pages
wrangler pages project create payment-gateways-status
```

### 3.5 Desplegar

```bash
# Desplegar el sitio
wrangler pages deploy . --project-name=payment-gateways-status
```

Wrangler te dará una URL para previsualizar y luego la URL de producción.

## Paso 4: Configurar dominio personalizado (Opcional)

### 4.1 Comprar un dominio (si no tienes uno)

1. Cloudflare ofrece dominios a buen precio
2. O puedes comprar en Namecheap, GoDaddy, etc.

### 4.2 Agregar el dominio a Cloudflare

1. Ve a tu proyecto en Cloudflare Pages
2. Haz clic en **"Custom domains"**
3. Haz clic en **"Set up a custom domain"**
4. Ingresa tu dominio (ej: `status.misitio.com`)
5. Sigue las instrucciones para configurar los DNS

### 4.3 Configurar DNS

Si tu dominio está en Cloudflare:
1. Cloudflare configurará automáticamente los registros DNS

Si tu dominio está en otro proveedor:
1. Cloudflare te dará los registros DNS que necesitas agregar
2. Generalmente son registros CNAME que apuntan a tu sitio de Pages

## Paso 5: Configurar auto-deploy (Opcional)

Con el método de GitHub, cada vez que hagas push a tu repositorio:

```bash
# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push
```

Cloudflare automáticamente:
1. Detectará el cambio
2. Hará un nuevo build
3. Desplegará la nueva versión

## Paso 6: Monitorear y administrar

### Ver logs del build

1. Ve a Workers & Pages → Tu proyecto
2. Haz clic en la pestaña **"Deployments"**
3. Haz clic en un deployment específico
4. Verás los logs del build

### Configurar reglas de caché

1. Ve a Workers & Pages → Tu proyecto
2. Haz clic en **"Settings"**
3. Configura reglas de caché según necesites

### Configuraranalytics

1. Ve a Workers & Pages → Tu proyecto
4. Haz clic en **"Analytics"**
5. Verás estadísticas de visitas, rendimiento, etc.

## Paso 7: Solución de problemas

### El build falla

1. Verifica que el archivo `index.html` exista en la raíz
2. Verifica que no haya errores de sintaxis en HTML/CSS/JS
3. Revisa los logs del build para ver el error específico

### El sitio no carga correctamente

1. Verifica que las rutas de los archivos sean correctas
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que las APIs permitan CORS (puede necesitar un proxy)

### Auto-deploy no funciona

1. Verifica que el webhook esté configurado en GitHub
2. Ve a tu repositorio en GitHub → Settings → Webhooks
3. Verifica que el webhook de Cloudflare esté activo

### Error de CORS

Si las APIs de las pasarelas bloquean peticiones desde el navegador:

**Opción 1: Usar un proxy CORS**
```javascript
// En script.js, cambia las URLs a:
url: 'https://corsproxy.io/?' + encodeURIComponent('https://status.astropay.com/api/v2/status.json')
```

**Opción 2: Crear un Cloudflare Worker como proxy**
1. Crea un Worker en Cloudflare
2. Configura el Worker para hacer las peticiones al backend
3. Llama al Worker desde tu sitio de Pages

**Opción 3: Usar un backend**
- Necesitarías un servidor backend (Node.js, Python, etc.)
- El backend hace las peticiones a las APIs
- Tu frontend se conecta a tu backend

## Paso 8: Actualizar el sitio

Para hacer cambios en el futuro:

```bash
# 1. Hacer cambios en los archivos
# 2. Agregar y commit
git add .
git commit -m "Descripción del cambio"

# 3. Push a GitHub
git push

# 4. Cloudflare Pages hará auto-deploy automáticamente
```

O si usas Wrangler CLI:

```bash
# Desplegar manualmente
wrangler pages deploy . --project-name=payment-gateways-status
```

## Paso 9: Optimizaciones adicionales

### Habilitar compresión

Cloudflare Pages comprime automáticamente los archivos.

### Configurar headers personalizados

1. Ve a Workers & Pages → Tu proyecto
2. Haz clic en **"Settings"**
3. Agrega headers personalizados si es necesario

### Configurar redirects

1. Ve a Workers & Pages → Tu proyecto
2. Haz clic en **"Settings"**
3. Agrega reglas de redirect si es necesario

## ¡Listo!

Tu sitio de monitoreo de pasarelas de pago está ahora en línea en Cloudflare Pages.

**URL típica**: `https://payment-gateways-status.pages.dev`

**Compartir**: Puedes compartir esta URL con cualquiera para que vea el estado de las pasarelas de pago.