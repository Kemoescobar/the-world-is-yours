-- Remove seeded demo freelance prospect (audit: no fake pipeline clients)
delete from public.prospects
where nom = 'Client démo'
   or (nom ilike '%démo%' and montant = 500000);
