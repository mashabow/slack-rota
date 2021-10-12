import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_BYTES = 16; // AES では 16 バイト

/**
 * 任意文字列のハッシュをとって、AES-256-CBC の鍵（32バイト）として使える Buffer を生成する
 * @param secret 任意の文字列
 * @returns 32バイトの Buffer
 */
const secretToKey = (secret: string): Buffer =>
  crypto.createHash("sha256").update(secret).digest();

/**
 * 共通鍵方式で暗号化する
 * @param plain 平文
 * @param secret 鍵として使う文字列
 * @returns base64 文字列。先頭部分は暗号化に使った IV
 */
export const encrypt = (plain: string, secret: string): string => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, secretToKey(secret), iv);
  return Buffer.concat([
    iv,
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]).toString("base64");
};

/**
 * 共通鍵方式で暗号化された内容を復号する
 * @param encrypted encrypt() で暗号化した base64 文字列
 * @param secret 暗号化に使った secret
 * @returns 平文
 */
export const decrypt = (encrypted: string, secret: string): string => {
  const buffer = Buffer.from(encrypted, "base64");
  const iv = buffer.slice(0, IV_BYTES);
  const body = buffer.slice(IV_BYTES);
  const decipher = crypto.createDecipheriv(ALGORITHM, secretToKey(secret), iv);
  try {
    return decipher.update(body, "base64", "utf8") + decipher.final("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt: ${error}`);
  }
};
