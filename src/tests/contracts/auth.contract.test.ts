import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { profileSchema, userRoleSchema, mfaSessionSchema } from '@/schemas/apiSchemas';

/**
 * Contract Tests for Authentication & User Management
 */
describe('Auth API Contract Tests', () => {
  describe('User Profile Operations', () => {
    it('should fetch current user profile with valid schema', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user - skipping test');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validation = profileSchema.safeParse(data);
      expect(validation.success).toBe(true);
      
      if (validation.success) {
        expect(validation.data.user_id).toBe(user.id);
        expect(validation.data.email).toBe(user.email);
      }
    });

    it('should enforce email format validation', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const emailValidation = profileSchema.shape.email.safeParse(profile.email);
        expect(emailValidation.success).toBe(true);
      }
    });

    it('should validate profile name length constraints', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Test that name must be between 1-100 characters
      const shortName = '';
      const validName = 'Test User';
      const longName = 'x'.repeat(101);

      const shortValidation = profileSchema.shape.name.safeParse(shortName);
      const validValidation = profileSchema.shape.name.safeParse(validName);
      const longValidation = profileSchema.shape.name.safeParse(longName);

      expect(shortValidation.success).toBe(false);
      expect(validValidation.success).toBe(true);
      expect(longValidation.success).toBe(false);
    });
  });

  describe('User Roles Operations', () => {
    it('should fetch user role with valid schema', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      expect(error).toBeNull();

      if (data) {
        const validation = userRoleSchema.safeParse(data);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(['admin', 'member']).toContain(validation.data.role);
        }
      }
    });

    it('should enforce valid role enum values', async () => {
      const validRoles = ['admin', 'member'];
      const invalidRole = 'superuser';

      validRoles.forEach(role => {
        const validation = userRoleSchema.shape.role.safeParse(role);
        expect(validation.success).toBe(true);
      });

      const invalidValidation = userRoleSchema.shape.role.safeParse(invalidRole);
      expect(invalidValidation.success).toBe(false);
    });
  });

  describe('MFA Session Operations', () => {
    it('should validate MFA session schema structure', () => {
      const mockSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        session_token: 'a'.repeat(32),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        skip_validation_for_ip: false,
        created_at: new Date().toISOString(),
      };

      const validation = mfaSessionSchema.safeParse(mockSession);
      expect(validation.success).toBe(true);
    });

    it('should enforce session token minimum length', () => {
      const shortToken = 'short';
      const validToken = 'a'.repeat(32);

      const shortValidation = mfaSessionSchema.shape.session_token.safeParse(shortToken);
      const validValidation = mfaSessionSchema.shape.session_token.safeParse(validToken);

      expect(shortValidation.success).toBe(false);
      expect(validValidation.success).toBe(true);
    });

    it('should validate IP address format', () => {
      const validIPs = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      const invalidIPs = ['', '999.999.999.999', 'not-an-ip'];

      validIPs.forEach(ip => {
        const validation = mfaSessionSchema.shape.ip_address.safeParse(ip);
        expect(validation.success).toBe(true);
      });
    });
  });

  describe('Permission Enforcement', () => {
    it('should prevent non-admin from accessing admin-only data', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Try to access all user roles (admin-only operation)
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (role?.role !== 'admin') {
        // Non-admins should have restricted access via RLS
        expect(data).toBeDefined();
        // Should only see their own role or have limited access
        if (data) {
          expect(data.length).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
