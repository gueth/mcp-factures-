-- Rôle utilisé par le serveur MCP : lecture seule sur les deux tables
create role mcp_lecteur login password 'lecteur';
grant connect on database factures to mcp_lecteur;
grant usage on schema public to mcp_lecteur;
grant select on clients, factures to mcp_lecteur;
alter role mcp_lecteur set default_transaction_read_only = on;
alter role mcp_lecteur set statement_timeout = '5s';
