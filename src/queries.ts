import { MAX_LIGNES } from "./guards.js";

export interface FiltresFactures {
  client?: string;
  statut?: "payee" | "en_attente" | "en_retard";
  date_min?: string;
  date_max?: string;
  limite?: number;
}

/** Construit une requête paramétrée (jamais de concaténation de valeurs utilisateur). */
export function requeteListeFactures(filtres: FiltresFactures): { text: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filtres.client) {
    values.push(`%${filtres.client}%`);
    conditions.push(`c.nom ILIKE $${values.length}`);
  }
  if (filtres.statut) {
    values.push(filtres.statut);
    conditions.push(`f.statut = $${values.length}`);
  }
  if (filtres.date_min) {
    values.push(filtres.date_min);
    conditions.push(`f.date_emission >= $${values.length}`);
  }
  if (filtres.date_max) {
    values.push(filtres.date_max);
    conditions.push(`f.date_emission <= $${values.length}`);
  }

  const limite = Math.min(Math.max(filtres.limite ?? 20, 1), MAX_LIGNES);
  values.push(limite);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return {
    text:
      `SELECT f.numero, c.nom AS client, f.date_emission, f.date_echeance, f.montant_ttc, f.statut ` +
      `FROM factures f JOIN clients c ON c.id = f.client_id ${where} ` +
      `ORDER BY f.date_emission DESC LIMIT $${values.length}`,
    values,
  };
}
