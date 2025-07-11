import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { envs } from "./envs";

/**
 * Encrypts a JWT token using AES encryption
 * @param token - The JWT token to encrypt
 * @param sKeyAes - The AES encryption key
 * @returns The encrypted token as a string
 * @example
 * ```typescript
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * const aesKey = 'mySecretAESKey';
 * const encryptedToken = encryptToken(token, aesKey);
 * ```
 */
function encryptToken(token: string, sKeyAes: string): string {
  return CryptoJS.AES.encrypt(token, sKeyAes).toString();
}

/**
 * Generates an encrypted service token using JWT and AES encryption
 * @param payload - The data to be encoded in the JWT token
 * @param sKeyAes - The AES encryption key
 * @param sKeyJwt - The JWT signing key
 * @returns Promise that resolves to the encrypted service token
 * @example
 * ```typescript
 * const payload = { userId: '123', role: 'admin' };
 * const aesKey = 'mySecretAESKey';
 * const jwtKey = 'mySecretJWTKey';
 * const encryptedToken = await generateServiceToken(payload, aesKey, jwtKey);
 * ```
 */
export async function generateServiceToken(
  payload: object,
  sKeyAes: string,
  sKeyJwt: string
): Promise<string> {
  const token = jwt.sign(payload, sKeyJwt, {
    expiresIn: "3m",
  });
  return encryptToken(token, sKeyAes);
}
