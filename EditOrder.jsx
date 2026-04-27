import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { OrdersAPI } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ClientSection from '@/components/order-form/ClientSection';
import EventSection from '@/components/order-form/EventSection';
import ServerDeliverySection from '@/components/order-form/ServerDeliverySection';
import AddressSection from '@/components/order-form/AddressSection';
import QuantitySection from '@/components/order-form/QuantitySection';
import FlavorsSection from '@/components/order-form/FlavorsSection';
import SticksStickersSection from '@/components/order-form/SticksStickersSection';
import CartSection from '@/components/order-form/CartSection';
import { Save, ArrowLeft } from 'lucide-react';

export default function EditOrder() {
  const { id: orderId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const order = await OrdersAPI.get(orderId);
        if (order) {
          const flavors = order.flavors || [];
          while (flavors.length < 10) flavors.push({ name: '', qty: '' });
          const toppings = order.toppings || [];
          while (toppings.length < 5) toppings.push('');
          setData({ ...order, flavors, toppings });
        }
      } catch (err) {
        toast.error('Could not load order');
      }
      setLoading(false);
    })();
  }, [orderId]);

  const updateMutation = useMutation({
    mutationFn: (orderData) => {
      const cleaned = {
        ...orderData,
        flavors: (orderData.flavors || []).filter(f => f.name?.trim()),
        toppings: (orderData.toppings || []).filter(t => t?.trim()),
      };
      return OrdersAPI.update(orderId, cleaned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated!');
      navigate('/orders');
    },
    onError: (err) => toast.error(err.message || 'Failed to update'),
  });

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-center py-20 text-muted-foreground">Order not found</div>;

  return (
    <div className="bg-card border border-border rounded shadow-lg overflow-hidden max-w-[800px] mx-auto">
      <div className="flex items-center justify-between p-4 border-b-2 border-border flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}><ArrowLeft className="w-5 h-5" /></Button>
          <span className="font-serif text-lg font-bold text-foreground">Edit Order</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-semibold text-foreground">Invoice #</span>
          <Input value={data.invoice || ''} onChange={e => setData({ ...data, invoice: e.target.value })} className="border-0 border-b border-border rounded-none bg-transparent px-1 focus-visible:ring-0 focus-visible:border-primary w-28 text-sm" />
        </div>
      </div>
      <ClientSection data={data} onChange={setData} />
      <EventSection data={data} onChange={setData} />
      <ServerDeliverySection data={data} onChange={setData} />
      <AddressSection data={data} onChange={setData} />
      <QuantitySection data={data} onChange={setData} />
      <FlavorsSection data={data} onChange={setData} />
      <SticksStickersSection data={data} onChange={setData} />
      <CartSection data={data} onChange={setData} />
      <div className="p-4 bg-secondary border-t border-border flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/orders')} className="text-muted-foreground">Cancel</Button>
        <Button onClick={() => updateMutation.mutate(data)} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
          <Save className="w-4 h-4 mr-1.5" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
