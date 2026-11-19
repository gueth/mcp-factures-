insert into clients (nom, email) values
  ('Boulangerie Martin', 'contact@boulangerie-martin.fr'),
  ('Garage Dupuis', 'compta@garage-dupuis.fr'),
  ('Cabinet Leroy', 'admin@cabinet-leroy.fr');

insert into factures (numero, client_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) values
  ('F-2026-001', 1, '2026-09-01', '2026-10-01', 1200.00, 240.00, 1440.00, 'payee'),
  ('F-2026-002', 2, '2026-09-15', '2026-10-15', 850.00, 170.00, 1020.00, 'en_retard'),
  ('F-2026-003', 3, '2026-10-01', '2026-10-31', 2300.00, 460.00, 2760.00, 'payee'),
  ('F-2026-004', 1, '2026-10-20', '2026-11-20', 640.00, 128.00, 768.00, 'en_attente'),
  ('F-2026-005', 2, '2026-11-02', '2026-12-02', 1500.00, 300.00, 1800.00, 'en_attente'),
  ('F-2026-006', 3, '2026-08-10', '2026-09-10', 400.00, 80.00, 480.00, 'en_retard');
