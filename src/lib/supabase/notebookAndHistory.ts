import { createClient } from '@/lib/supabase/client';
import { SubjectNotebook, Subject } from '@/lib/notebook';
import { ChatHistoryItem, ChatMessage } from '@/lib/chatHistory';

/**
 * Fetch all subject notebooks for the authenticated user from Supabase
 */
export async function fetchUserNotebooks(): Promise<SubjectNotebook[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_notebooks')
    .select('subject, notebook_data')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user notebooks:', error);
    return [];
  }

  return (data || []).map((row) => row.notebook_data as SubjectNotebook);
}

/**
 * Sync a single subject notebook to Supabase
 */
export async function syncUserNotebook(subject: string, notebook: SubjectNotebook) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const id = `${user.id}-${subject.toLowerCase().replace(/\s+/g, '-')}`;

  const { data, error } = await supabase
    .from('user_notebooks')
    .upsert(
      {
        id,
        user_id: user.id,
        subject,
        notebook_data: notebook,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) console.error('Error syncing notebook to Supabase:', error);
  return data;
}

/**
 * Fetch custom subjects list from Supabase
 */
export async function fetchUserSubjects(): Promise<Subject[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_subjects')
    .select('subjects')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subjects:', error);
    return [];
  }

  return (data?.subjects as Subject[]) || [];
}

/**
 * Sync custom subjects list to Supabase
 */
export async function syncUserSubjects(subjects: Subject[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_subjects')
    .upsert(
      {
        user_id: user.id,
        subjects,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) console.error('Error syncing subjects to Supabase:', error);
  return data;
}

/**
 * Fetch chat sessions history from Supabase
 */
export async function fetchChatSessions(): Promise<ChatHistoryItem[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, subject, unit, mode, timestamp')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }

  return (data || []) as ChatHistoryItem[];
}

/**
 * Fetch a specific chat transcript from Supabase
 */
export async function fetchChatTranscript(sessionId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_transcripts')
    .select('messages')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching chat transcript:', error);
    return [];
  }

  return (data?.messages as ChatMessage[]) || [];
}
