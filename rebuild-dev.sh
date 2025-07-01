#!/bin/bash

# Script para reconstruir el contenedor de desarrollo

echo "🔨 Reconstruyendo contenedor de desarrollo..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio fintrace-report-ms"
    exit 1
fi

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.dev.yml down

# Limpiar imágenes anteriores
echo "🧹 Limpiando imágenes anteriores..."
docker rmi fintrace-dev:latest 2>/dev/null || true

# Reconstruir imagen
echo "🔨 Reconstruyendo imagen Docker..."
docker build -f Dockerfile.dev -t fintrace-dev:latest .

if [ $? -eq 0 ]; then
    echo "✅ Imagen reconstruida correctamente"
else
    echo "❌ Error al reconstruir imagen"
    exit 1
fi

# Iniciar contenedor
echo "🚀 Iniciando contenedor..."
docker-compose -f docker-compose.dev.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Contenedor iniciado correctamente"
else
    echo "❌ Error al iniciar contenedor"
    exit 1
fi

# Verificar que el contenedor esté funcionando
echo "🔍 Verificando estado del contenedor..."
sleep 5
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🎉 Reconstrucción completada exitosamente!"
echo ""
echo "📋 Información:"
echo "- Contenedor: fintrace-dev"
echo "- Puerto: 3004"
echo "- URL: http://localhost:3004"
echo ""
echo "📝 Logs del contenedor:"
echo "docker-compose -f docker-compose.dev.yml logs -f" 