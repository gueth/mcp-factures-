# Serveur MCP Factures

Serveur [MCP](https://modelcontextprotocol.io) qui donne à un agent Claude un **accès en lecture seule** à une base de factures PostgreSQL, avec tests et garde-fous sur les requêtes.

Stack : TypeScript, Node.js, MCP SDK, PostgreSQL, GitHub Actions.

## Outils exposés

| Outil               | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `lister_factures`   | Liste les factures avec filtres (client, statut, dates), 100 lignes max     |
| `obtenir_facture`   | Détail d'une facture par son numéro                                         |
| `total_par_client`  | Totaux TTC par client (payé / en attente / en retard)                       |
| `requete_sql`       | Requête `SELECT` libre, validée par les garde-fous                          |

## Garde-fous

1. **Rôle PostgreSQL en lecture seule** (`mcp_lecteur`, uniquement `SELECT` sur `clients` et `factures`) — voir [db/03-role.sql](db/03-role.sql).
2. **Transaction `READ ONLY`** et `statement_timeout` de 5 s pour chaque requête — voir [src/db.ts](src/db.ts).
3. **Validation de `requete_sql`** — voir [src/guards.ts](src/guards.ts) :
   - une seule instruction, qui commence par `SELECT` ;
   - pas de commentaires SQL (`--`, `/* */`) ;
   - mots-clés interdits (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `INTO`, `pg_sleep`, …) ;
   - seules les tables `clients` et `factures` sont autorisées ;
   - le résultat est toujours limité à 100 lignes.
4. **Paramètres validés avec zod** et requêtes paramétrées (`$1`, `$2`…) pour les outils structurés.

## Démarrage

```bash
# 1. Base de données (schéma + données de démo + rôle lecture seule)
docker compose up -d

# 2. Serveur
cp .env.example .env
npm install
npm run build

# 3. Tests
npm test
```

## Utilisation avec Claude

Claude Code :
```bash
claude mcp add factures -e DATABASE_URL=postgres://mcp_lecteur:lecteur@localhost:5432/factures -- node /chemin/vers/mcp-factures/dist/index.js
```

Claude Desktop (`claude_desktop_config.json`) :
```json
{
  "mcpServers": {
    "factures": {
      "command": "node",
      "args": ["/chemin/vers/mcp-factures/dist/index.js"],
      "env": { "DATABASE_URL": "postgres://mcp_lecteur:lecteur@localhost:5432/factures" }
    }
  }
}
```

Exemples de questions : *« Quelles factures sont en retard ? »*, *« Quel client nous doit le plus ? »*.

## Intégration continue

[.github/workflows/ci.yml](.github/workflows/ci.yml) compile le projet et lance les tests à chaque push / pull request.
