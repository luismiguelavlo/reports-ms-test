import { Context, Next } from "hono";

export const validationTokenMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("x-token");

  console.log(token);
};
