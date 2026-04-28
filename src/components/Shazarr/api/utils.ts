export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const ALBUM_SUFFIX_PATTERNS = [
  /\s*[([]\s*(single|ep|deluxe|deluxe\s+edition|expanded|remaster(ed)?|reissue|anniversary\s+edition|bonus\s+tracks?|explicit)\s*[\])]/gi,
  /\s*-\s*(single|ep|deluxe|deluxe\s+edition|remaster(ed)?|reissue|explicit)\s*$/gi,
];

export function cleanAlbumTitle(title: string): string {
  let cleaned = title;
  for (const pattern of ALBUM_SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}
