import { describe, it, expect } from "@jest/globals";
import { encrypt, decrypt } from "../encrypt";

describe("encrypt", () => {
  const key = "0123456789abcedf0123456789abcedf";
  const plain = "This is a plain text!";

  it("decrypts an encrypted string to the original plain text with the same key", () => {
    expect(decrypt(encrypt(plain, key), key)).toEqual(plain);
  });

  it("with a wrong key", () => {
    expect(() =>
      decrypt(encrypt(plain, key), "00000000000000000000000000000000")
    ).toThrow("Failed to decrypt");
  });
});
