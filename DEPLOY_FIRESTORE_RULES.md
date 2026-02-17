# 🚀 Cómo Desplegar las Reglas de Seguridad de Firestore

## ⚠️ IMPORTANTE: Debes desplegar estas reglas manualmente

Las reglas de seguridad de Firestore que acabamos de mejorar están en el archivo `firestore.rules` pero **necesitan ser desplegadas a Firebase** para que tengan efecto.

---

## Método 1: Desde la Consola de Firebase (Recomendado) ✅

### Paso a Paso:

1. **Abre la Consola de Firebase**
   - Ve a: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Selecciona tu proyecto: **smartwell-v2**

2. **Navega a Firestore Database**
   - En el menú lateral, haz clic en **"Firestore Database"**
   - Ve a la pestaña **"Reglas"** (Rules)

3. **Copia y pega las nuevas reglas**
   - Abre el archivo `firestore.rules` de tu proyecto local
   - **Copia todo el contenido** del archivo
   - **Pega** en el editor de la consola de Firebase (reemplaza todo el contenido existente)

4. **Publica las reglas**
   - Haz clic en el botón **"Publicar"** (Publish)
   - Confirma la acción
   - ✅ ¡Listo! Las reglas ahora están activas

---

## Método 2: Usando Firebase CLI (Requiere instalación)

Si prefieres usar la línea de comandos:

### Instalación de Firebase CLI:

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Verificar instalación
firebase --version

# Login a Firebase
firebase login
```

### Desplegar las reglas:

```bash
cd /Users/maximilianovaldivia/SmartWell\ -\ v2/smartwell-web

# Desplegar solo las reglas de Firestore
firebase deploy --only firestore:rules
```

---

## ✅ Resumen de las Mejoras de Seguridad Aplicadas

### Protección contra Escalación de Privilegios

Las nuevas reglas **previenen que usuarios normales se conviertan en administradores**:

**Antes:**
```javascript
allow update: if isOwner(userId) || isAdmin();
```
❌ Usuarios podían actualizar su propio campo `role` a `admin`

**Ahora:**
```javascript
allow update: if isOwner(userId) && 
                !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']) ||
                isAdmin();
```
✅ Usuarios NO pueden modificar su campo `role`  
✅ Solo los administradores pueden cambiar roles

### Protección en Creación de Usuarios

```javascript
allow create: if isOwner(userId) && 
                (!request.resource.data.keys().hasAny(['role']) || 
                 request.resource.data.role == 'user');
```
✅ Nuevos usuarios no pueden registrarse directamente como admin  
✅ Por defecto, todos los usuarios nuevos tienen rol `user`

---

## 🧪 Cómo Verificar que las Reglas Están Activas

1. **Desde la Consola de Firebase:**
   - Ve a Firestore Database → Reglas
   - Verás la fecha y hora de la última publicación
   - Si dice "Hace unos momentos" o la fecha actual, están activas ✅

2. **Prueba de Seguridad (Opcional):**
   - Intenta crear un usuario desde tu app
   - Verifica en Firestore que el campo `role` es `user` (no `admin`)
   - Intenta modificar el rol desde el cliente → debe fallar con "Permission denied"

---

## 📋 Checklist Post-Despliegue

- [ ] Reglas desplegadas en Firebase Console
- [ ] Fecha de publicación actualizada
- [ ] Probar crear un nuevo usuario → debe tener `role: "user"`
- [ ] Probar acceder al panel admin con usuario normal → debe redirigir
- [ ] Acceder al panel admin con `maxivaldivia@icloud.com` → debe funcionar ✅

---

## 🚨 Si algo sale mal

Si después de desplegar las reglas hay problemas:

### Rollback (Volver atrás):

1. En la Consola de Firebase → Firestore Database → Reglas
2. Haz clic en **"Historial"** (History)
3. Selecciona la versión anterior
4. Haz clic en **"Restaurar"**

### Soporte:

- Las reglas anteriores están en el historial de Firebase
- Siempre puedes volver a la versión anterior si es necesario

---

## 🎯 Conclusión

**IMPORTANTE:** Las reglas de seguridad mejoradas solo estarán activas después de desplegarlas manualmente en la Consola de Firebase.

**Tiempo estimado:** 2-3 minutos ⏱️

---

*Fecha de creación: 17 de febrero de 2026*  
*Proyecto: SmartWell v2*  
*Admin: maxivaldivia@icloud.com*
