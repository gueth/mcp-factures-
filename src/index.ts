#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { lire } from "./db.js";
import { GardeFouErreur, validerRequete } from "./guards.js";
import { requeteListeFactures } from "./queries.js";

const server = new McpServer({ name: "mcp-factures", version: "1.0.0" });

function texte(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function erreur(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

server.registerTool(
  "lister_factures",
  {
    description: "Liste les factures, avec filtres optionnels (client, statut, période).",
    inputSchema: {
      client: z.string().max(100).optional().describe("Partie du nom du client"),
      statut: z.enum(["payee", "en_attente", "en_retard"]).optional(),
      date_min: z.string().date().optional().describe("Date d'émission minimale (AAAA-MM-JJ)"),
      date_max: z.string().date().optional().describe("Date d'émission maximale (AAAA-MM-JJ)"),
      limite: z.number().int().min(1).max(100).default(20),
    },
  },
  async (filtres) => {
    const { text, values } = requeteListeFactures(filtres);
    return texte(await lire(text, values));
  },
);

server.registerTool(
  "obtenir_facture",
  {
    description: "Renvoie le détail d'une facture à partir de son numéro (ex : F-2026-001).",
    inputSchema: { numero: z.string().max(50) },
  },
  async ({ numero }) => {
    const lignes = await lire(
      `SELECT f.*, c.nom AS client, c.email FROM factures f JOIN clients c ON c.id = f.client_id WHERE f.numero = $1`,
      [numero],
    );
    return lignes.length ? texte(lignes[0]) : erreur(`Facture ${numero} introuvable`);
  },
);

server.registerTool(
  "total_par_client",
  {
    description: "Totaux TTC par client : payé, en attente et en retard.",
    inputSchema: {},
  },
  async () =>
    texte(
      await lire(`
        SELECT c.nom AS client,
               SUM(f.montant_ttc) FILTER (WHERE f.statut = 'payee')      AS paye,
               SUM(f.montant_ttc) FILTER (WHERE f.statut = 'en_attente') AS en_attente,
               SUM(f.montant_ttc) FILTER (WHERE f.statut = 'en_retard')  AS en_retard
        FROM clients c LEFT JOIN factures f ON f.client_id = c.id
        GROUP BY c.nom ORDER BY c.nom`),
    ),
);

server.registerTool(
  "requete_sql",
  {
    description:
      "Exécute une requête SELECT en lecture seule sur les tables clients(id, nom, email) et " +
      "factures(id, numero, client_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut). " +
      "Résultat limité à 100 lignes.",
    inputSchema: { sql: z.string() },
  },
  async ({ sql }) => {
    try {
      return texte(await lire(validerRequete(sql)));
    } catch (e) {
      if (e instanceof GardeFouErreur) return erreur(`Requête refusée : ${e.message}`);
      return erreur(`Erreur SQL : ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

await server.connect(new StdioServerTransport());
console.error("Serveur MCP Factures démarré (stdio)");
