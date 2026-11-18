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

/**
 * Tidal qualifies editions far more freely than a keyword list can follow:
 * "(Expanded Version)", "(DMD)", "(2011 Remaster)". The list above only matches
 * a keyword glued to the closing bracket, so after it any trailing bracketed
 * group is dropped too — repeatedly, for "Album (Deluxe) (Remastered)".
 */
const TRAILING_BRACKET_GROUP = /\s*[([][^()[\]]*[\])]\s*$/;

export function cleanAlbumTitle(title: string): string {
  let cleaned = title;
  for (const pattern of ALBUM_SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  for (let previous = ""; previous !== cleaned;) {
    previous = cleaned;
    cleaned = cleaned.replace(TRAILING_BRACKET_GROUP, "");
  }
  cleaned = cleaned.trim();
  // A title made only of qualifiers would collapse to "", and two unrelated
  // releases would then compare equal.
  return cleaned || title.trim();
}

/**
 * Compares release or track titles while ignoring edition qualifiers.
 * Deliberately permissive on albums: a candidate kept too widely still has to
 * carry a matching track, and the user picks from the dialog — whereas a
 * candidate missed here is reported as "not on Tidal", which is a lie.
 */
export function titlesMatch(a: string, b: string): boolean {
  const left = normalize(cleanAlbumTitle(a));
  const right = normalize(cleanAlbumTitle(b));
  return left.length > 0 && left === right;
}
