/**
 * Transforme un texte libre (ex. "Tennis Club de Plouzané") en slug d'URL propre
 * (ex. "tennis-club-de-plouzane") : minuscules, sans accents, sans caractères spéciaux.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
