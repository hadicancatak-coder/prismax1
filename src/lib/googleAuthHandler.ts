import { supabase } from "@/integrations/supabase/client";

export const handleGoogleAuthCallback = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return;

  const email = session.user.email;
  if (!email?.endsWith('@cfi.trade')) {
    await supabase.auth.signOut();
    throw new Error("Only @cfi.trade email addresses are allowed");
  }

  // Check if a profile already exists with this email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile && existingProfile.user_id !== session.user.id) {
    // Link the existing profile to the new Google auth user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_id: session.user.id })
      .eq('email', email);

    if (updateError) {
      console.error("Failed to link Google account:", updateError);
    } else {
      // Log the linking event
      await supabase.from("auth_events").insert({
        user_id: session.user.id,
        event_type: "oauth_linked",
        success: true,
        metadata: { 
          provider: 'google',
          linked_from_email: email,
          previous_user_id: existingProfile.user_id
        }
      });
    }
  }
};
