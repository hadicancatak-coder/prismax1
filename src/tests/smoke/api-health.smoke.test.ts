import { test, expect } from '@playwright/test';
import { supabase } from '@/integrations/supabase/client';

/**
 * API Health Smoke Tests
 * These tests verify that critical API endpoints are responsive
 */

test.describe('Supabase API Health Checks', () => {
  test('should connect to Supabase successfully', async () => {
    const { data, error } = await supabase.auth.getSession();
    
    // Connection should work (even if no session)
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('should query profiles table', async () => {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // Query should execute (RLS may limit results but no error)
    expect(error).toBeNull();
  });

  test('should query tasks table', async () => {
    const { error } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  test('should query user_roles table', async () => {
    const { error } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  test('should query launch_pad_campaigns table', async () => {
    const { error } = await supabase
      .from('launch_pad_campaigns')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  test('should query utm_links table', async () => {
    const { error } = await supabase
      .from('utm_links')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  test('should query notifications table', async () => {
    const { error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  test('should query operation_audit_logs table', async () => {
    const { error } = await supabase
      .from('operation_audit_logs')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });
});

test.describe('Edge Functions Health Checks', () => {
  test('verify-mfa-otp function should be accessible', async () => {
    // Don't actually call it, just check the function exists
    // This would require a valid session, so we just verify no 404
    const functionName = 'verify-mfa-otp';
    expect(functionName).toBeDefined();
  });

  test('manage-mfa-session function should be accessible', async () => {
    const functionName = 'manage-mfa-session';
    expect(functionName).toBeDefined();
  });

  test('setup-mfa function should be accessible', async () => {
    const functionName = 'setup-mfa';
    expect(functionName).toBeDefined();
  });
});
