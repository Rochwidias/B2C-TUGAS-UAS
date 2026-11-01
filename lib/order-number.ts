import { randomBytes } from "node:crypto";

export function orderNumber(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `PS-${yyyy}${mm}${dd}-${suffix}`;
}
