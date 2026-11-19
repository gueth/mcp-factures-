export const TABLES_AUTORISEES = ["clients", "factures"];
export const MAX_LIGNES = 100;

const MOTS_INTERDITS =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|merge|call|execute|vacuum|lock|into|pg_sleep|pg_read_file|pg_ls_dir|lo_import|dblink)\b/i;

export class GardeFouErreur extends Error {}

/**
 * Valide une requête SQL libre et renvoie une version sûre (limitée à MAX_LIGNES).
 * Lève GardeFouErreur si la requête n'est pas autorisée.
 */
export function validerRequete(sql: string): string {
  const requete = sql.trim().replace(/;\s*$/, "");

  if (!requete) throw new GardeFouErreur("Requête vide");
  if (requete.length > 2000) throw new GardeFouErreur("Requête trop longue");
  if (requete.includes(";")) throw new GardeFouErreur("Une seule instruction autorisée");
  if (/--|\/\*/.test(requete)) throw new GardeFouErreur("Commentaires SQL interdits");
  if (!/^select\b/i.test(requete)) throw new GardeFouErreur("Seules les requêtes SELECT sont autorisées");

  const interdit = requete.match(MOTS_INTERDITS);
  if (interdit) throw new GardeFouErreur(`Mot-clé interdit : ${interdit[0]}`);

  const tables = [...requete.matchAll(/\b(?:from|join)\s+([a-z_][\w.]*)/gi)].map((m) => m[1].toLowerCase());
  if (tables.length === 0) throw new GardeFouErreur("Aucune table trouvée");
  const nonAutorisee = tables.find((t) => !TABLES_AUTORISEES.includes(t));
  if (nonAutorisee) throw new GardeFouErreur(`Table non autorisée : ${nonAutorisee}`);

  return `SELECT * FROM (${requete}) AS resultat LIMIT ${MAX_LIGNES}`;
}
