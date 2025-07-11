import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { pdfController } from "./controller/pdf.controller.js";
import { validationTokenMiddleware } from "./middleware/validation-token.middleware.js";

const app = new Hono();

// CORS configuration
app.use(cors());

// Health check endpoint
app.get("/v1/reports/health", (c) => {
  return c.json({
    success: true,
    message: "FinTrace PDF Generator API",
    version: "1.0.0",
    endpoints: {
      health: "GET /",
      example: "GET /api/finance-report/example",
      generatePDF: "POST /api/finance-report/generate-pdf",
      preview: "POST /api/finance-report/preview",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const api = app.basePath("/v1/reports");

api.get("/generate-pdf", validationTokenMiddleware, (c) =>
  pdfController.generateFinanceReport(c)
);

app.get("/generate-pdf", validationTokenMiddleware, (c) =>
  pdfController.generateFinanceReport(c)
);

app.get("/get-data/:clientId", validationTokenMiddleware, (c) =>
  pdfController.getData(c)
);

// Export handler for Lambda
export const handler = handle(app);

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = 3004;
  console.log(`🚀 FinTrace PDF Generator running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
} else {
  // For production (EC2)
  const port = process.env.PORT || 3004;
  console.log(
    `🚀 FinTrace PDF Generator starting in production mode on port ${port}`
  );

  serve({
    fetch: app.fetch,
    port: parseInt(port.toString()),
  });
}
