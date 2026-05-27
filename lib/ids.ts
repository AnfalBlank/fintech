import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const nano10 = customAlphabet(alphabet, 10);
const nano6 = customAlphabet("0123456789", 6);

export function newId(prefix: string): string {
  return `${prefix}-${nano10()}`;
}

export function newOtp(): string {
  return nano6();
}

export function newReference(prefix: string): string {
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  return `${prefix}-${stamp}-${nano10()}`;
}

export function applicationId(): string {
  return newId("APP");
}

export function installmentId(): string {
  return newId("INS");
}

export function paymentId(): string {
  return newId("PAY");
}

export function deliveryId(): string {
  return newId("DLV");
}

export function assetId(): string {
  return newId("AST");
}

export function fraudId(): string {
  return newId("FRD");
}

export function notificationId(): string {
  return newId("NTF");
}

export function userId(): string {
  return newId("USR");
}
