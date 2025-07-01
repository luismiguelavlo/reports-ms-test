#!/bin/bash

# Script para instalar Chromium en EC2 Ubuntu
echo "🚀 Instalando Chromium en EC2 Ubuntu..."

# Actualizar repositorios
echo "📦 Actualizando repositorios..."
sudo apt-get update

# Instalar Chromium y dependencias
echo "🔧 Instalando Chromium y dependencias..."
sudo apt-get install -y \
    chromium-browser \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-freefont-ttf \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    libxshmfence1 \
    libgbm1 \
    libgtk-3-0 \
    --no-install-recommends

# Verificar instalación
echo "✅ Verificando instalación..."
if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium instalado correctamente"
    echo "📍 Ubicación: $(which chromium-browser)"
    echo "📋 Versión: $(chromium-browser --version)"
else
    echo "❌ Error: Chromium no se instaló correctamente"
    exit 1
fi

echo ""
echo "🎉 Instalación completada!"
echo ""
echo "📋 Información adicional:"
echo "- Chromium path: /usr/bin/chromium-browser"
echo "- Para verificar: chromium-browser --version" 