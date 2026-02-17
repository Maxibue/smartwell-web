#!/bin/bash

# Script para ayudar a descargar las credenciales de Firebase
# Este script te guiará paso a paso

echo "🔑 DESCARGA DE CREDENCIALES DE FIREBASE"
echo "========================================"
echo ""
echo "Opción 1: Usar curl (requiere autenticación)"
echo "Opción 2: Instrucciones manuales"
echo ""
read -p "Elige una opción (1 o 2): " option

if [ "$option" = "1" ]; then
    echo ""
    echo "Para usar curl, necesitas un token de acceso de Google Cloud."
    echo "Ve a: https://console.cloud.google.com/"
    echo "Abre DevTools (⌘+Option+I)"
    echo "Ve a la pestaña 'Application' → 'Cookies'"
    echo "Copia el valor de la cookie 'SAPISID'"
    echo ""
    read -p "Pega el valor de SAPISID aquí: " sapisid
    
    if [ -z "$sapisid" ]; then
        echo "❌ Error: No se proporcionó SAPISID"
        exit 1
    fi
    
    echo ""
    echo "Descargando credenciales..."
    
    # Intentar descargar usando la API de IAM
    curl -X POST \
      "https://iam.googleapis.com/v1/projects/smartwell-v2/serviceAccounts/firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com/keys" \
      -H "Authorization: Bearer $sapisid" \
      -H "Content-Type: application/json" \
      -d '{"privateKeyType":"TYPE_GOOGLE_CREDENTIALS_FILE"}' \
      -o ~/Downloads/smartwell-v2-credentials.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Archivo descargado en: ~/Downloads/smartwell-v2-credentials.json"
        echo ""
        echo "Ahora ejecuta:"
        echo "cat ~/Downloads/smartwell-v2-credentials.json"
    else
        echo "❌ Error al descargar. Intenta la opción 2."
    fi
else
    echo ""
    echo "📋 INSTRUCCIONES MANUALES:"
    echo "=========================="
    echo ""
    echo "1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts?project=smartwell-v2"
    echo ""
    echo "2. Haz clic en: firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com"
    echo ""
    echo "3. Ve a la pestaña 'Claves' (Keys)"
    echo ""
    echo "4. Haz clic en 'Agregar clave' → 'Crear clave nueva'"
    echo ""
    echo "5. Selecciona 'JSON' y haz clic en 'Crear'"
    echo ""
    echo "6. El archivo se descargará automáticamente"
    echo ""
    echo "7. Abre el archivo con:"
    echo "   cat ~/Downloads/smartwell-v2-*.json"
    echo ""
    echo "8. Copia el contenido y pégalo en el chat con Antigravity"
    echo ""
fi
