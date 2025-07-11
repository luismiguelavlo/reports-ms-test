import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { envs } from "../config/envs";

export const validationTokenMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("x-token");

  console.log("token", token);

  if (!token) {
    return c.json({ message: "token is required" }, 401);
  }

  try {
    const bytes = CryptoJS.AES.decrypt(token, envs.SECRET_AES_REPORT_MS);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedToken) {
      return c.json({ message: "invalid token (AES)" }, 401);
    }

    const payload = jwt.verify(decryptedToken, envs.SECRET_JWT_REPORT_MS);
    c.set("servicePayload", payload);

    await next();
  } catch (err) {
    return c.json({ message: "invalid token or expired" }, 401);
  }
};
