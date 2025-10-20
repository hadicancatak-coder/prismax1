import { supabase } from "@/integrations/supabase/client";

export const cleanupDatabase = async (keepUserIds: string[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-users', {
      body: { usersToKeep: keepUserIds }
    });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};
