export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD") // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (é → e)
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .replace(/[\s]+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}
