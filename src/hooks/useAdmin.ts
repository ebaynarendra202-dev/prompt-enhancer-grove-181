import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminStats {
  total_improvements: number;
  total_shared: number;
  total_templates: number;
  total_favorites: number;
  total_chains: number;
  improvements_today: number;
  improvements_this_week: number;
  improvements_this_month: number;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface SharedPromptEntry {
  id: string;
  share_id: string;
  original_prompt: string;
  improved_prompt: string;
  ai_model: string;
  view_count: number;
  created_at: string;
}

interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

interface ActivityLogEntry {
  id: string;
  performed_by: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sharedPrompts, setSharedPrompts] = useState<SharedPromptEntry[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin');

      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data && data.length > 0);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (!error && data) {
      setStats(data as unknown as AdminStats);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, created_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchSharedPrompts = async () => {
    const { data, error } = await supabase
      .from('shared_prompts')
      .select('id, share_id, original_prompt, improved_prompt, ai_model, view_count, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setSharedPrompts(data);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');
    if (!error && data) {
      setSettings(data as unknown as AppSetting[]);
    }
  };

  const updateSetting = async (key: string, value: Record<string, unknown>) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: value as unknown as Record<string, unknown>, updated_by: user!.id, updated_at: new Date().toISOString() } as any, { onConflict: 'key' });
    if (!error) {
      await fetchSettings();
    }
    return { error };
  };

  const deleteSharedPrompt = async (id: string) => {
    setSharedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role');
    if (!error && data) {
      return data as { user_id: string; role: string }[];
    }
    return [];
  };

  const logActivity = async (action: string, targetUserId?: string, details?: Record<string, unknown>) => {
    await supabase.from('admin_activity_log').insert({
      performed_by: user!.id,
      action,
      target_user_id: targetUserId || null,
      details: details || {},
    } as any);
  };

  const fetchActivityLog = async () => {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) {
      setActivityLog(data as unknown as ActivityLogEntry[]);
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role } as any);
    if (!error) {
      await logActivity('role_assigned', userId, { role });
    }
    return { error };
  };

  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    if (!error) {
      await logActivity('role_removed', userId, { role });
    }
    return { error };
  };

  const loadAllData = async () => {
    await Promise.all([fetchStats(), fetchUsers(), fetchSharedPrompts(), fetchSettings(), fetchActivityLog()]);
  };

  return {
    isAdmin,
    loading,
    stats,
    users,
    sharedPrompts,
    settings,
    activityLog,
    loadAllData,
    updateSetting,
    deleteSharedPrompt,
    assignRole,
    removeRole,
    fetchUserRoles,
    logActivity,
    fetchActivityLog,
    fetchStats,
    fetchUsers,
    fetchSharedPrompts,
    fetchSettings,
  };
};
