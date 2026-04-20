export function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/gi, "").trim();
}
