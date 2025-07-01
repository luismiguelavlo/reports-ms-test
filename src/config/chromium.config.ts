// Configuración de Chromium para diferentes entornos
const isDevelopment = process.env.NODE_ENV === "development";

// Configuración para desarrollo (usando Chromium del sistema)
const developmentConfig = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-extensions",
  ],
  defaultViewport: { width: 1200, height: 800 },
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
};

// Configuración para producción (usando @sparticuz/chromium)
const productionConfig = async () => {
  const chromium = await import("@sparticuz/chromium");
  return {
    args: [
      ...chromium.default.args,
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-extensions",
    ],
    defaultViewport: { width: 1200, height: 800 },
    executablePath: chromium.default.executablePath,
    headless: true,
  };
};

// Exportar configuración dinámica
export const getChromiumConfig = async () => {
  if (isDevelopment) {
    return developmentConfig;
  } else {
    return await productionConfig();
  }
};

// Configuración adicional para el entorno de Lambda
export const lambdaConfig = {
  // Directorio temporal para Puppeteer
  cacheDir: "/tmp/puppeteer",
  // Tiempo de espera para operaciones
  timeout: 30000,
};

// Configuración de Chromium para EC2 Ubuntu (sistema)
export const chromiumConfig = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-extensions",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
  defaultViewport: { width: 1200, height: 800 },
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
};

// Configuración adicional
export const appConfig = {
  // Directorio temporal para Puppeteer
  cacheDir: "/tmp/puppeteer",
  // Tiempo de espera para operaciones
  timeout: 30000,
  // Puerto de la aplicación
  port: process.env.PORT || 3004,
};
