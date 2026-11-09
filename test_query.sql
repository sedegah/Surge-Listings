SELECT a.id, a.public_ref, a.bank_id, a.ownership_type, b.legal_name as bank_name 
FROM assets a 
JOIN banks b ON a.bank_id = b.id 
WHERE (a.bank_id = 'bank-surge' OR a.owner_bank_id = 'bank-surge' OR a.ownership_type = 'surge' OR b.short_code = 'SURGE' OR b.id = 'bank-surge');
