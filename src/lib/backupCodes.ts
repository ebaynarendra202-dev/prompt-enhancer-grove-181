import { supabase } from "@/integrations/supabase/client";

// Generate a random backup code
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.slice(0, 4) + '-' + code.slice(4);
};

// Simple hash function for backup codes (using Web Crypto API)
const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace('-', '').toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate 10 backup codes
export const generateBackupCodes = async (userId: string): Promise<string[]> => {
  // First, delete any existing backup codes
  await supabase
    .from('backup_codes')
    .delete()
    .eq('user_id', userId);

  const codes: string[] = [];
  const insertData: { user_id: string; code_hash: string }[] = [];

  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    codes.push(code);
    const hash = await hashCode(code);
    insertData.push({ user_id: userId, code_hash: hash });
  }

  const { error } = await supabase
    .from('backup_codes')
    .insert(insertData);

  if (error) throw error;

  return codes;
};

// Verify and use a backup code
export const verifyBackupCode = async (userId: string, code: string): Promise<boolean> => {
  const hash = await hashCode(code);

  // Find unused backup code
  const { data, error } = await supabase
    .from('backup_codes')
    .select('id')
    .eq('user_id', userId)
    .eq('code_hash', hash)
    .is('used_at', null)
    .single();

  if (error || !data) return false;

  // Mark as used
  await supabase
    .from('backup_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);

  return true;
};

// Get count of remaining backup codes
export const getRemainingBackupCodes = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('backup_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('used_at', null);

  if (error) return 0;
  return count || 0;
};
