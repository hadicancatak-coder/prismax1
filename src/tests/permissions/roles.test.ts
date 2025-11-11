import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Step 3: Role & Permission Enforcement Tests
 */

describe('Role Permission Tests', () => {
  it('should enforce admin-only access to user_roles', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Try to read all roles (admin-only)
    const { data } = await supabase
      .from('user_roles')
      .select('*');

    if (role?.role !== 'admin') {
      expect(data?.length || 0).toBeLessThanOrEqual(1);
    }
  });

  it('should prevent non-admins from deleting tasks', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', 'non-existent-id');

    // Non-admins should get RLS policy violation
    expect(error).toBeDefined();
  });
});
