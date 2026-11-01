export function cn(...values: Array<string | false | null | undefined | 0 | 0n>): string {
  return values.filter((v): v is string => typeof v === "string" && v.length > 0).join(" ");
}
