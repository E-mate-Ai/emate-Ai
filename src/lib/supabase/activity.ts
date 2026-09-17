import { createClient } from "@/lib/supabase/client";

// Log activity (e.g. when user sends a chat message)
export async function logUserActivity(activityType: string, modelUsed?: string, metadata: object = {}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_activity")
    .insert([
      {
        user_id: user.id,
        activity_type: activityType,
        model_used: modelUsed,
        metadata: metadata,
      },
    ]);

  if (error) console.error("Error logging activity:", error);
  return data;
}

// Fetch active user profile
export async function getUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) console.error("Error fetching profile:", error);
  return data;
}
