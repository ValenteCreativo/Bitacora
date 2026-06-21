import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid();
}

export function now(): number {
  return Date.now();
}

export function isValidUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    // Try with https:// prefix
    try {
      new URL(`https://${input}`);
      return input.includes(".");
    } catch {
      return false;
    }
  }
}
