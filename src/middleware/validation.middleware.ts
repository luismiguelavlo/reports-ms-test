import { Context, Next } from "hono";
import { z } from "zod";

/**
 * Middleware para validar el body de la request usando Zod schemas
 * @param schema - Schema de Zod para validar
 * @returns Middleware function para Hono
 */
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();

      // Validar el body usando el schema
      const validationResult = schema.safeParse(body);

      if (!validationResult.success) {
        // Formatear errores de validación
        const errors = validationResult.error.errors.map((error) => ({
          path: error.path.join("."),
          message: error.message,
          code: error.code,
        }));

        return c.json(
          {
            success: false,
            error: "Validation failed",
            details: errors,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      // Agregar los datos validados al contexto
      c.set("validatedData", validationResult.data);

      await next();
    } catch (error) {
      console.error("Validation middleware error:", error);

      return c.json(
        {
          success: false,
          error: "Invalid JSON format",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        400
      );
    }
  };
};

/**
 * Helper para obtener los datos validados del contexto
 * @param c - Contexto de Hono
 * @returns Datos validados
 */
export const getValidatedData = <T>(c: Context): T => {
  const data = c.get("validatedData");
  if (!data) {
    throw new Error(
      "No validated data found in context. Make sure to use validation middleware."
    );
  }
  return data as T;
};
