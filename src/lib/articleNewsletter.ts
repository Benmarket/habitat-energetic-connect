import { supabase } from '@/integrations/supabase/client';

export async function applyNewsletterChoice(postId: string, send: boolean, request = async (id: string) => {
  const { data, error } = await supabase.rpc('request_article_newsletter', { p_post_id: id });
  if (error) throw error;
  return data;
}) {
  if (!send) return { status: 'not_requested' };
  return request(postId);
}