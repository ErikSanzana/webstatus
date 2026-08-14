# Guía Paso a Paso para Configurar GitHub

## Paso 1: Preparar tu cuenta de GitHub

1. **Crear cuenta (si no tienes una)**
   - Ve a [github.com](https://github.com)
   - Haz clic en "Sign up"
   - Completa el formulario de registro
   - Verifica tu correo electrónico

2. **Crear un Personal Access Token (recomendado)**
   - Ve a GitHub → Settings (icono de perfil)
   - En el menú lateral, haz clic en "Developer settings"
   - Haz clic en "Personal access tokens" → "Tokens (classic)"
   - Haz clic en "Generate new token (classic)"
   - Dale un nombre (ej: "Devin CLI")
   - Selecciona los scopes necesarios:
     - ✅ repo (control total de repositorios privados)
     - ✅ workflow (para GitHub Actions si lo necesitas)
   - Haz clic en "Generate token"
   - **IMPORTANTE**: Copia el token y guárdalo en un lugar seguro (no lo volverás a ver)

## Paso 2: Configurar Git en tu computadora

Abre Git Bash o la terminal y ejecuta:

```bash
# Configurar tu nombre de usuario
git config --global user.name "Tu Nombre"

# Configurar tu email (debe ser el mismo de tu cuenta de GitHub)
git config --global user.email "tu-email@ejemplo.com"
```

## Paso 3: Crear el repositorio en GitHub

1. Inicia sesión en [github.com](https://github.com)
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Completa la información:
   - **Repository name**: `payment-gateways-status` (o el nombre que prefieras)
   - **Description**: Página web para monitorear pasarelas de pago
   - **Public/Private**: Selecciona según tu preferencia
   - **NO selecciones** "Add a README file" (ya tenemos uno)
   - **NO selecciones** "Add .gitignore"
   - **NO selecciones** "Choose a license"
5. Haz clic en **"Create repository"**

## Paso 4: Subir los archivos a GitHub

Abre la terminal en tu carpeta del proyecto:

```bash
cd C:\Users\home\Desktop\pythons\WEBSTATUS
```

Ejecuta los siguientes comandos uno por uno:

```bash
# 1. Inicializar git
git init

# 2. Agregar todos los archivos al área de staging
git add .

# 3. Verificar qué archivos se van a commit
git status

# 4. Hacer el primer commit
git commit -m "Initial commit - Payment gateways status page"

# 5. Renombrar la rama a main (si aún está en master)
git branch -M main

# 6. Conectar con tu repositorio de GitHub
# REEMPLAZA TU_USUARIO con tu nombre de usuario de GitHub
# REEMPLAZA TU_REPOSITORIO con el nombre de tu repositorio
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 7. Verificar la conexión
git remote -v

# 8. Subir los archivos
# Si te pide usuario y contraseña:
# - Usuario: tu nombre de usuario de GitHub
# - Contraseña: el Personal Access Token que creaste en el Paso 1
git push -u origin main
```

## Paso 5: Verificar que todo funcionó

1. Ve a tu repositorio en GitHub
2. Deberías ver todos los archivos:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - `GITHUB_SETUP.md`

## Paso 6: Configurar autenticación con SSH (Opcional pero recomendado)

Si no quieres escribir tu token cada vez, configura SSH:

```bash
# 1. Generar una clave SSH
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# 2. Iniciar el agente SSH
eval "$(ssh-agent -s)"

# 3. Agregar tu clave privada
ssh-add ~/.ssh/id_ed25519

# 4. Copiar tu clave pública
cat ~/.ssh/id_ed25519.pub
```

Luego:
1. Ve a GitHub → Settings → SSH and GPG keys
2. Haz clic en "New SSH key"
3. Pega el contenido de tu clave pública
4. Haz clic en "Add SSH key"

Para usar SSH en lugar de HTTPS:

```bash
# Cambiar el remote a SSH
git remote set-url origin git@github.com:TU_USUARIO/TU_REPOSITORIO.git

# Verificar
git remote -v
```

## Paso 7: Comandos útiles para el futuro

```bash
# Ver cambios no commit
git status

# Ver qué archivos cambiaron
git diff

# Agregar archivos específicos
git add nombre-archivo.html

# Commit con mensaje
git commit -m "Descripción del cambio"

# Subir cambios
git push

# Actualizar tu repositorio local con cambios de GitHub
git pull

# Ver historial de commits
git log --oneline
```

## Solución de problemas comunes

### Error: "fatal: remote origin already exists"

```bash
# Eliminar el remote existente
git remote remove origin

# Agregar el nuevo remote
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

### Error: "Authentication failed"

1. Verifica que tu nombre de usuario sea correcto
2. Usa el Personal Access Token como contraseña (no tu contraseña de GitHub)
3. Si usas 2FA, DEBES usar un Personal Access Token

### Error: "Permission denied"

1. Verifica que el repositorio sea tuyo o que tengas acceso
2. Verifica que el nombre del repositorio sea correcto
3. Si es privado, asegúrate de tener acceso

### Error: "SSL certificate problem"

```bash
# Solución temporal (no recomendada para producción)
git config --global http.sslVerify false

# Solución mejor: actualizar git o configurar certificados
```

## ¡Listo!

Tu repositorio está conectado a GitHub y listo para ser usado con Cloudflare Pages.