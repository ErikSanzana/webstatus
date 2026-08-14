# Estado de Pasarelas de Pago

Página web estilosa para visualizar el estado en tiempo real de pasarelas de pago.

## Características

- ✨ Diseño moderno con animaciones suaves
- 🎨 Interfaz responsive y atractiva
- 🔄 Auto-refresh cada 30 segundos (opcional)
- 📊 Monitoreo de 7 pasarelas de pago:
  - AstroPay
  - Kushki
  - WebPay (Transbank)
  - MACH
  - MercadoPago
  - Skinsback
  - CoinPaid
- 🎯 Indicadores visuales de estado (operativo, problemas menores, mayores, crítico, mantenimiento)

## Archivos del Proyecto

- `index.html` - Estructura principal de la página
- `styles.css` - Estilos y animaciones
- `script.js` - Lógica para consultar las APIs de las pasarelas

## Instrucciones para GitHub

### 1. Crear un repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el botón "+" en la esquina superior derecha
3. Selecciona "New repository"
4. Dale un nombre a tu repositorio (ej: `payment-gateways-status`)
5. Selecciona "Public" o "Private" según tu preferencia
6. Haz clic en "Create repository"

### 2. Subir los archivos a GitHub

Abre una terminal en tu carpeta del proyecto (`C:\Users\home\Desktop\pythons\WEBSTATUS`) y ejecuta:

```bash
# Inicializar git
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit - Payment gateways status page"

# Renombrar la rama principal a main (si es necesario)
git branch -M main

# Conectar con tu repositorio de GitHub
# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
# Reemplaza TU_REPOSITORIO con el nombre de tu repositorio
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Subir los archivos
git push -u origin main
```

### 3. Verificar la conexión

```bash
# Verificar el remote configurado
git remote -v

# Ver el estado del repositorio
git status
```

## Instrucciones para Cloudflare Pages

### Opción 1: Conectar directamente desde GitHub

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com) e inicia sesión
2. En el menú lateral, selecciona "Workers & Pages"
3. Haz clic en "Create application"
4. Selecciona la pestaña "Pages"
5. Haz clic en "Connect to Git"
6. Autoriza Cloudflare para acceder a tu cuenta de GitHub (si es la primera vez)
7. Selecciona el repositorio que creaste anteriormente
8. Configura el proyecto:
   - **Project name**: payment-gateways-status (o el nombre que prefieras)
   - **Production branch**: main
   - **Framework preset**: None
   - **Build command**: (dejar vacío)
   - **Build output directory**: (dejar vacío o poner `.`)
9. Haz clic en "Save and Deploy"

### Opción 2: Usar Wrangler CLI

Si prefieres usar la línea de comandos:

```bash
# Instalar Wrangler (si no lo tienes)
npm install -g wrangler

# Iniciar sesión en Cloudflare
wrangler login

# Crear el proyecto
wrangler pages project create payment-gateways-status

# Desplegar
cd C:\Users\home\Desktop\pythons\WEBSTATUS
wrangler pages deploy . --project-name=payment-gateways-status
```

### Configuración adicional (opcional)

Para dominio personalizado:
1. Ve a tu proyecto en Cloudflare Pages
2. Haz clic en "Custom domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar los DNS

## Solución de problemas

### Problemas de CORS

Si algunas APIs no responden debido a restricciones de CORS, puedes:

1. Usar un proxy CORS
2. Configurar Cloudflare Workers como proxy
3. Usar una API de backend en lugar de consultar directamente desde el cliente

### Auto-refresh no funciona

Verifica que:
- El checkbox de auto-refresh esté activado
- No haya errores en la consola del navegador (F12)
- Las APIs estén accesibles desde tu navegador

## Personalización

### Cambiar colores

Edita `styles.css` y modifica las variables de color en las clases `.status-indicator` y `.status-text`.

### Agregar más pasarelas

Edita `script.js` y agrega un nuevo objeto al array `services`:

```javascript
{
    name: 'Nombre Pasarela',
    url: 'https://api-url.com',
    type: 'statuspage' // o 'components' o 'http'
}
```

### Modificar tiempo de auto-refresh

En `script.js`, cambia el valor en `setInterval(updateServices, 30000)` (30000 = 30 segundos).

## Licencia

Este proyecto es de código abierto y puede ser utilizado libremente.