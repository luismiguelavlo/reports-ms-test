#!/bin/bash

# Script para verificar que el template esté en el lugar correcto

echo "🔍 Verificando configuración del template..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio fintrace-report-ms"
    exit 1
fi

# Verificar que el template existe en src/template
if [ -f "src/template/template.html" ]; then
    echo "✅ Template encontrado en src/template/template.html"
    echo "📄 Tamaño del archivo: $(ls -lh src/template/template.html | awk '{print $5}')"
else
    echo "❌ Error: No se encontró src/template/template.html"
    exit 1
fi

# Verificar que el CSS existe
if [ -f "src/template/style.css" ]; then
    echo "✅ CSS encontrado en src/template/style.css"
    echo "📄 Tamaño del archivo: $(ls -lh src/template/style.css | awk '{print $5}')"
else
    echo "❌ Error: No se encontró src/template/style.css"
    exit 1
fi

# Verificar la estructura del directorio
echo ""
echo "📁 Estructura del directorio template:"
ls -la src/template/

echo ""
echo "🎉 Verificación completada exitosamente!"
echo ""
echo "📋 Información adicional:"
echo "- NODE_ENV: ${NODE_ENV:-no definido}"
echo "- Directorio actual: $(pwd)"
echo "- Ruta del template: $(pwd)/src/template/template.html" 