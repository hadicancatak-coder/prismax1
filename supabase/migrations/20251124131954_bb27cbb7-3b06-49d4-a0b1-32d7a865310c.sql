-- Assign the "Monthly Report" recurring task to Adel
INSERT INTO task_assignees (task_id, user_id, assigned_by)
SELECT 
  '2e0532df-17dd-4849-90c4-27bc0a892c88'::uuid,
  p.id,
  p.id
FROM profiles p
WHERE p.name ILIKE '%adel%'
LIMIT 1
ON CONFLICT DO NOTHING;