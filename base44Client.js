import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const OrdersAPI = {
  async list() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async get(id) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(orderData) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('orders').insert([{ ...orderData, user_id: user.id }]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, orderData) {
    const { id: _id, created_at, user_id, ...updateData } = orderData;
    const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },
};

export async function uploadFile(file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from('order-images').upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('order-images').getPublicUrl(data.path);
  return { file_url: urlData.publicUrl };
}

// Legacy compatibility shim so old imports still work
export const base44 = {
  entities: {
    Order: {
      create: (d) => OrdersAPI.create(d),
      list: () => OrdersAPI.list(),
      update: (id, d) => OrdersAPI.update(id, d),
      delete: (id) => OrdersAPI.delete(id),
    }
  },
  integrations: {
    Core: {
      UploadFile: ({ file }) => uploadFile(file),
    }
  },
};
