import React, { useState, useEffect } from 'react';
import { supabase, OrdersAPI } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, LogOut } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AppSettings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({ email1: '', email2: '', instagram: '@cielitoartisanpops', phone: '' });

  useEffect(() => {
    if (user) {
      supabase.from('user_settings').select('*').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setSettings(s => ({ ...s, ...data })); });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...settings });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Settings saved!'),
    onError: (err) => toast.error(err.message),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const orders = await OrdersAPI.list();
      for (const order of orders) await OrdersAPI.delete(order.id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success('All orders deleted'); },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-serif text-2xl font-bold text-foreground">⚙️ Settings</h1>
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-3">📧 Email Notifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Employee email 1</Label><Input value={settings.email1} onChange={e => setSettings(s => ({ ...s, email1: e.target.value }))} placeholder="team@cielitoartisanpops.com" className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Employee email 2 (optional)</Label><Input value={settings.email2} onChange={e => setSettings(s => ({ ...s, email2: e.target.value }))} placeholder="another@email.com" className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Instagram</Label><Input value={settings.instagram} onChange={e => setSettings(s => ({ ...s, instagram: e.target.value }))} placeholder="@cielitoartisanpops" className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} placeholder="+1 954 000 0000" className="mt-1" /></div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-1">🗑️ Data Management</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-full sm:w-auto mt-2">
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete all orders
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete all orders?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteAllMutation.mutate()} className="bg-destructive text-destructive-foreground">{deleteAllMutation.isPending ? 'Deleting…' : 'Delete All'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-1">🚪 Session</h2>
        <p className="text-sm text-muted-foreground mb-4">Signed in as <strong>{user?.email}</strong></p>
        <Button variant="outline" onClick={logout} className="w-full sm:w-auto"><LogOut className="w-4 h-4 mr-1.5" /> Log Out</Button>
      </div>
    </div>
  );
}
