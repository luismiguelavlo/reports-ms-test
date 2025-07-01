import chromium from "@sparticuz/chromium";

// Configuración de Chromium para AWS Lambda
export const chromiumConfig = {
  args: [
    ...chromium.args,
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-extensions",
  ],
  defaultViewport: chromium.defaultViewport,
  executablePath: chromium.executablePath,
  headless: chromium.headless,
};

// Configuración adicional para el entorno de Lambda
export const lambdaConfig = {
  // Directorio temporal para Puppeteer
  cacheDir: "/tmp/puppeteer",
  // Tiempo de espera para operaciones
  timeout: 30000,
};
