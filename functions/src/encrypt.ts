import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_BYTES = 16; // AES では 16 バイト

export const encrypt = (plain: string, key: string): string => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  return Buffer.concat([
    iv,
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]).toString("base64");
};

export const decrypt = (encrypted: string, key: string): string => {
  const buffer = Buffer.from(encrypted, "base64");
  const iv = buffer.slice(0, IV_BYTES);
  const body = buffer.slice(IV_BYTES);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  try {
    return decipher.update(body, "base64", "utf8") + decipher.final("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt: ${error}`);
  }
};
