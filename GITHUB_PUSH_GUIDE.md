# 🔐 Guía para Subir Código a GitHub

## ✅ Estado Actual

- [x] Repositorio creado en GitHub: `Maxibue/smartwell-web`
- [x] Código preparado localmente (commit hecho)
- [ ] Código subido a GitHub (falta este paso)

---

## 🎯 **Opción 1: Usar GitHub Desktop** (MÁS FÁCIL)

### Paso 1: Descargar GitHub Desktop
1. Ve a: https://desktop.github.com
2. Descarga e instala GitHub Desktop
3. Inicia sesión con tu cuenta de GitHub

### Paso 2: Agregar el Repositorio
1. En GitHub Desktop: **File** → **Add Local Repository**
2. Selecciona la carpeta: `/Users/maximilianovaldivia/SmartWell - v2/smartwell-web`
3. Click **"Add Repository"**

### Paso 3: Publicar
1. Click en **"Publish repository"** (arriba)
2. Asegúrate que el nombre sea: `smartwell-web`
3. Desmarcar **"Keep this code private"** (queremos que sea público)
4. Click **"Publish Repository"**

✅ ¡Listo! Tu código estará en GitHub en 1-2 minutos.

---

## 🎯 **Opción 2: Usar Token de GitHub** (Desde Terminal)

### Paso 1: Crear Personal Access Token
1. Ve a: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Nombre: `SmartWell Deploy`
4. Selecciona scope: **repo** (marca todo en repo)
5. Click **"Generate token"**
6. **COPIA EL TOKEN** (solo se muestra una vez)

### Paso 2: Configurar Git con el Token
Ejecuta estos comandos en terminal:

```bash
cd "/Users/maximilianovaldivia/SmartWell - v2/smartwell-web"

# Cambiar remote a HTTPS
git remote set-url origin https://github.com/Maxibue/smartwell-web.git

# Push con token (reemplaza YOUR_TOKEN con el token que copiaste)
git push -u origin main
# Cuando pida username: Maxibue
# Cuando pida password: pega tu token
```

---

## 🎯 **Opción 3: Configurar SSH** (Más Técnico)

### Paso 1: Generar SSH Key
```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
# Presiona Enter 3 veces (acepta defaults)
```

### Paso 2: Copiar la Clave Pública
```bash
cat ~/.ssh/id_ed25519.pub
# Copia todo el output
```

### Paso 3: Agregar a GitHub
1. Ve a: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `MacBook Pro`
4. Pega la clave pública
5. Click **"Add SSH key"**

### Paso 4: Probar y Push
```bash
ssh -T git@github.com
# Debería decir: "Hi Maxibue! You've successfully authenticated"

cd "/Users/maximilianovaldivia/SmartWell - v2/smartwell-web"
git push -u origin main
```

---

## ✅ **Recomendación**

**Usa la Opción 1 (GitHub Desktop)** - Es la más fácil y visual.

Una vez que el código esté en GitHub:
1. Vuelve a Vercel
2. Refresca la página
3. Tu repositorio `smartwell-web` aparecerá
4. Click en **"Import"**
5. Continúa con el deploy

---

## 🆘 **¿Necesitas Ayuda?**

Dime qué opción prefieres y te ayudo paso a paso:
- "Opción 1" - Te guío con GitHub Desktop
- "Opción 2" - Te ayudo a crear el token
- "Opción 3" - Te ayudo a configurar SSH

---

## 📊 **Progreso del Deploy**

1. ✅ Cuenta de Vercel creada
2. ✅ Repositorio de GitHub creado
3. ✅ Código preparado localmente
4. ⏳ **Subir código a GitHub** ← Estamos aquí
5. ⏳ Importar en Vercel
6. ⏳ Configurar variables de entorno
7. ⏳ Deploy
8. ⏳ Configurar dominio

**Estamos al 50% del proceso!** 🚀
