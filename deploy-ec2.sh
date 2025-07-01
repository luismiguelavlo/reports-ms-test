#!/bin/bash

# Script de despliegue para EC2 Ubuntu
echo "🚀 Desplegando fintrace-report-ms en EC2..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio fintrace-report-ms"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

# Construir el proyecto
echo "🔨 Construyendo el proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al construir el proyecto"
    exit 1
fi

# Verificar que Chromium esté instalado
echo "🔍 Verificando Chromium..."
if ! command -v chromium-browser &> /dev/null; then
    echo "⚠️  Chromium no encontrado. Ejecutando instalación..."
    chmod +x install-ec2.sh
    ./install-ec2.sh
else
    echo "✅ Chromium ya está instalado"
    echo "📍 Ubicación: $(which chromium-browser)"
    echo "📋 Versión: $(chromium-browser --version)"
fi

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.ec2.yml down 2>/dev/null || true

# Limpiar imágenes anteriores
echo "🧹 Limpiando imágenes anteriores..."
docker rmi fintrace-ec2:latest 2>/dev/null || true

# Construir imagen Docker
echo "🐳 Construyendo imagen Docker..."
docker build -f Dockerfile.ec2 -t fintrace-ec2:latest .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir imagen Docker"
    exit 1
fi

# Iniciar contenedor
echo "🚀 Iniciando contenedor..."
docker-compose -f docker-compose.ec2.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar contenedor"
    exit 1
fi

# Verificar que el contenedor esté funcionando
echo "🔍 Verificando estado del contenedor..."
sleep 10
docker-compose -f docker-compose.ec2.yml ps

# Verificar que la aplicación responda
echo "🌐 Verificando que la aplicación responda..."
if curl -f http://localhost:3004/health > /dev/null 2>&1; then
    echo "✅ Aplicación respondiendo correctamente"
else
    echo "⚠️  La aplicación aún no responde, revisando logs..."
    docker-compose -f docker-compose.ec2.yml logs --tail=20
fi

echo ""
echo "🎉 Despliegue completado exitosamente!"
echo ""
echo "📋 Información:"
echo "- Contenedor: fintrace-ec2"
echo "- Puerto: 3004"
echo "- URL: http://localhost:3004"
echo "- Health check: http://localhost:3004/health"
echo ""
echo "📝 Comandos útiles:"
echo "- Ver logs: docker-compose -f docker-compose.ec2.yml logs -f"
echo "- Detener: docker-compose -f docker-compose.ec2.yml down"
echo "- Reiniciar: docker-compose -f docker-compose.ec2.yml restart" 