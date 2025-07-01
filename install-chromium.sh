#!/bin/bash

# Script de instalación para @sparticuz/chromium en fintrace-report-ms

echo "🚀 Configurando @sparticuz/chromium para AWS Lambda..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio fintrace-report-ms"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que las dependencias se instalaron correctamente
if [ ! -d "node_modules/@sparticuz/chromium" ]; then
    echo "❌ Error: @sparticuz/chromium no se instaló correctamente"
    exit 1
fi

echo "✅ @sparticuz/chromium instalado correctamente"

# Construir el proyecto
echo "🔨 Construyendo el proyecto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Proyecto construido correctamente"
else
    echo "❌ Error al construir el proyecto"
    exit 1
fi

echo ""
echo "🎉 Configuración completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Construir la imagen Docker: docker build -t fintrace-report-ms ."
echo "2. Desplegar en AWS Lambda"
echo "3. Verificar que los PDFs se generan correctamente"
echo ""
echo "📚 Para más información, consulta CHROMIUM_SETUP.md" 