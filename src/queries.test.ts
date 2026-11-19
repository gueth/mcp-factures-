import { describe, expect, it } from "vitest";
import { requeteListeFactures } from "./queries.js";

describe("requeteListeFactures", () => {
  it("sans filtre : pas de WHERE et limite par défaut", () => {
    const { text, values } = requeteListeFactures({});
    expect(text).not.toContain("WHERE");
    expect(values).toEqual([20]);
  });

  it("utilise des paramètres pour les valeurs (pas d'injection)", () => {
    const { text, values } = requeteListeFactures({ client: "x'; DROP TABLE factures; --", statut: "en_retard" });
    expect(text).not.toContain("DROP");
    expect(text).toContain("c.nom ILIKE $1");
    expect(text).toContain("f.statut = $2");
    expect(values).toEqual(["%x'; DROP TABLE factures; --%", "en_retard", 20]);
  });

  it("borne la limite à 100", () => {
    const { values } = requeteListeFactures({ limite: 5000 });
    expect(values.at(-1)).toBe(100);
  });
});
