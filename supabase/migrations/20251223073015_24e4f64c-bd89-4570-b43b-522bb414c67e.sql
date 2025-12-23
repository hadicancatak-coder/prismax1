
-- Allow all authenticated users to create, update knowledge pages (keep delete for admins only)
DROP POLICY IF EXISTS "Admins can create knowledge pages" ON knowledge_pages;
DROP POLICY IF EXISTS "Admins can update knowledge pages" ON knowledge_pages;

CREATE POLICY "Authenticated users can create knowledge pages"
ON knowledge_pages
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update knowledge pages"
ON knowledge_pages
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow all authenticated users to create, update tech stack pages (keep delete for admins only)
DROP POLICY IF EXISTS "Admins can insert tech stack pages" ON tech_stack_pages;
DROP POLICY IF EXISTS "Admins can update tech stack pages" ON tech_stack_pages;

CREATE POLICY "Authenticated users can create tech stack pages"
ON tech_stack_pages
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tech stack pages"
ON tech_stack_pages
FOR UPDATE
USING (auth.role() = 'authenticated');
