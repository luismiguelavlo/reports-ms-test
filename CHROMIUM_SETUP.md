# Solución para Chromium en AWS Lambda

## Problema

El error original era:

```
Could not find Chrome (ver. 137.0.7151.55). This can occur if either
 1. you did not perform an installation before running the script (e.g. `npx puppeteer browsers install chrome`) or
 2. your cache path is incorrectly configured (which is: /home/sbx_user1051/.cache/puppeteer).
```

## Solución Implementada

### 1. Cambios en Dependencias (`package.json`)

- Reemplazado `puppeteer` por `puppeteer-core`
- Agregado `@sparticuz/chromium` versión `^137.0.1`
- Removido `@serverless-chrome/lambda`

### 2. Cambios en Dockerfile

- Removido `RUN npx puppeteer browsers install chrome`
- Agregadas variables de entorno:
  - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
  - `PUPPETEER_CACHE_DIR=/tmp/puppeteer`

### 3. Cambios en el Código

- Actualizado `pdf.service.ts` para usar `puppeteer-core` con `@sparticuz/chromium`
- Creado archivo de configuración `chromium.config.ts`
- Configuración optimizada para AWS Lambda

## ¿Por qué @sparticuz/chromium?

[@sparticuz/chromium](https://github.com/Sparticuz/chromium) es una librería específicamente diseñada para usar Chromium en plataformas serverless como AWS Lambda. Proporciona:

- Binarios de Chromium optimizados para Lambda
- Configuraciones predefinidas para entornos serverless
- Mejor rendimiento y menor tamaño de imagen
- Soporte para arquitecturas x64 y arm64

## Configuración de Chromium

El archivo `chromium.config.ts` incluye:

- Argumentos optimizados para Lambda
- Configuración de viewport
- Configuración de headless mode
- Configuraciones adicionales para estabilidad

## Variables de Entorno

```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_CACHE_DIR=/tmp/puppeteer
```

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Construir la imagen Docker:

```bash
docker build -t fintrace-report-ms .
```

3. Desplegar en AWS Lambda

## Verificación

Para verificar que todo funciona correctamente:

1. Revisar los logs de Lambda
2. Verificar que no aparezcan errores de Chrome no encontrado
3. Confirmar que los PDFs se generan correctamente

## Notas Adicionales

- La librería `@sparticuz/chromium` maneja automáticamente la extracción y configuración del binario de Chromium
- El tamaño de la imagen Docker se reduce significativamente
- Mejor rendimiento en el entorno de Lambda
- Soporte para las últimas versiones de Chromium
