#!/bin/bash

# Script para desplegar reglas e índices de Firestore
# Uso: ./deploy-firestore.sh

echo "🚀 Desplegando configuración de Firestore..."

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI no está instalado"
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que el usuario esté autenticado
echo "🔐 Verificando autenticación..."
firebase login:list

# Desplegar reglas de seguridad
echo ""
echo "📋 Desplegando reglas de seguridad..."
firebase deploy --only firestore:rules

# Desplegar índices
echo ""
echo "📊 Desplegando índices..."
firebase deploy --only firestore:indexes

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📝 Notas importantes:"
echo "  - Las reglas de seguridad están activas inmediatamente"
echo "  - Los índices pueden tardar unos minutos en construirse"
echo "  - Verifica el estado en Firebase Console"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com"
