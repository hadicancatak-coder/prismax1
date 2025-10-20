# Emergency MFA Bypass Guide

## When to Use
Use this **ONLY** when a user has lost both:
1. Their authenticator app (TOTP device)
2. All backup codes

## How to Grant 2-Hour Bypass

Run this SQL in the backend (replace email with actual user's email):

```sql
-- Replace 'user@cfi.trade' with the actual user's email
UPDATE profiles 
SET mfa_temp_bypass_until = now() + interval '2 hours',
    mfa_enrollment_required = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@cfi.trade'
);
```

## What Happens Next

1. **User can log in** within the 2-hour window
2. **Access is restricted** to `/profile` and `/setup-mfa` only
3. **User MUST re-enroll MFA** with new TOTP + backup codes
4. **Bypass automatically expires** after 2 hours

## Security Notes

- This bypass is **single-user only** - no blanket bypass
- Forces immediate MFA re-enrollment
- All sensitive actions still blocked during bypass
- Bypass tracked in auth_events table
