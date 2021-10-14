import { describe, it, expect } from "@jest/globals";
import { encrypt, decrypt } from "../encrypt";

describe("encrypt", () => {
  const secret = "secret";
  const plain = "This is a plaintext!";

  it("decrypts an encrypted string to the original plaintext with the same secret", () => {
    expect(decrypt(encrypt(plain, secret), secret)).toEqual(plain);
  });

  it("throws an error when decrypting with a wrong secret", () => {
    expect(() => decrypt(encrypt(plain, secret), "wrong secret")).toThrow(
      "Failed to decrypt"
    );
  });
});
