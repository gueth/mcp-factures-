import { describe, expect, it } from "vitest";
import { GardeFouErreur, MAX_LIGNES, validerRequete } from "./guards.js";

describe("validerRequete", () => {
  it("accepte un SELECT simple et ajoute une limite", () => {
    const sql = validerRequete("SELECT numero, montant_ttc FROM factures WHERE statut = 'en_retard';");
    expect(sql).toContain(`LIMIT ${MAX_LIGNES}`);
    expect(sql).toContain("FROM factures WHERE statut = 'en_retard'");
  });

  it("accepte une jointure entre tables autorisées", () => {
    expect(() =>
      validerRequete("SELECT c.nom, SUM(f.montant_ttc) FROM factures f JOIN clients c ON c.id = f.client_id GROUP BY c.nom"),
    ).not.toThrow();
  });

  it.each([
    ["DELETE FROM factures", "SELECT"],
    ["UPDATE factures SET statut = 'payee'", "SELECT"],
    ["SELECT 1 FROM factures; DROP TABLE factures", "Une seule instruction"],
    ["SELECT * FROM factures -- commentaire", "Commentaires"],
    ["SELECT * FROM factures /* x */", "Commentaires"],
    ["SELECT * INTO copie FROM factures", "interdit"],
    ["SELECT pg_sleep(10) FROM factures", "interdit"],
    ["SELECT * FROM pg_user", "Table non autorisée"],
    ["SELECT * FROM information_schema.tables", "Table non autorisée"],
    ["SELECT 1", "Aucune table"],
    ["", "vide"],
  ])("refuse %s", (sql, message) => {
    expect(() => validerRequete(sql)).toThrow(GardeFouErreur);
    expect(() => validerRequete(sql)).toThrow(message);
  });

  it("refuse une requête trop longue", () => {
    expect(() => validerRequete(`SELECT * FROM factures WHERE numero = '${"x".repeat(2000)}'`)).toThrow("trop longue");
  });
});
