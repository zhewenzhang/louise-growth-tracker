import { supabase } from '../lib/supabase';

/**
 * Supabase 數據同步服務
 * 當 Supabase 未配置時自動降級為本地模式
 */

// 檢查 Supabase 是否可用
export const isSupabaseAvailable = () => !!supabase;

// 用戶數據同步
export const syncUserData = async (user) => {
  if (!supabase) return { success: false, reason: 'supabase_not_configured' };
  
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: 'default_user', // 簡化版 - 單用戶
        name: user.name,
        birth_date: user.birthDate,
        gender: user.gender,
        birth_weight: user.birthWeight,
        birth_height: user.birthHeight,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('同步用戶數據失敗:', error);
    return { success: false, error };
  }
};

export const loadUserData = async () => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'default_user')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到記錄
      throw error;
    }
    
    return {
      name: data.name,
      birthDate: data.birth_date,
      gender: data.gender,
      birthWeight: data.birth_weight,
      birthHeight: data.birth_height
    };
  } catch (error) {
    console.error('加載用戶數據失敗:', error);
    return null;
  }
};

// 成長記錄同步
export const syncGrowthRecords = async (records) => {
  if (!supabase) return { success: false, reason: 'supabase_not_configured' };
  
  try {
    // 先清除舊數據，再插入新數據（簡化版同步策略）
    const { error: deleteError } = await supabase
      .from('growth_records')
      .delete()
      .eq('user_id', 'default_user');
    
    if (deleteError) throw deleteError;
    
    if (records.length > 0) {
      const { error: insertError } = await supabase
        .from('growth_records')
        .insert(records.map(r => ({
          user_id: 'default_user',
          record_date: r.date,
          type: r.type,
          value: r.value,
          unit: r.unit,
          note: r.note,
          created_at: new Date().toISOString()
        })));
      
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('同步成長記錄失敗:', error);
    return { success: false, error };
  }
};

export const loadGrowthRecords = async () => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('growth_records')
      .select('*')
      .eq('user_id', 'default_user')
      .order('record_date', { ascending: true });
    
    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      date: d.record_date,
      type: d.type,
      value: d.value,
      unit: d.unit,
      note: d.note
    }));
  } catch (error) {
    console.error('加載成長記錄失敗:', error);
    return [];
  }
};

// 監聽 Supabase 實時變化
export const subscribeToChanges = (callback) => {
  if (!supabase) return { unsubscribe: () => {} };
  
  const channel = supabase
    .channel('growth_records_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'growth_records',
        filter: 'user_id=eq.default_user'
      },
      (payload) => {
        console.log('收到 Supabase 實時更新:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};
