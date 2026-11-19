create table clients (
  id serial primary key,
  nom text not null,
  email text
);

create table factures (
  id serial primary key,
  numero text not null unique,
  client_id integer not null references clients(id),
  date_emission date not null,
  date_echeance date not null,
  montant_ht numeric(12, 2) not null,
  tva numeric(12, 2) not null,
  montant_ttc numeric(12, 2) not null,
  statut text not null check (statut in ('payee', 'en_attente', 'en_retard'))
);
