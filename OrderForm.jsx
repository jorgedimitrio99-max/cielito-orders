import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
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
import { Check, RotateCcw } from 'lucide-react';

const emptyOrder = {
  invoice: '',
  company: '',
  brand: '',
  contact: '',
  phone: '',
  event_date: '',
  has_server: false,
  service_time: '',
  setup_time: '',
  attire: '',
  has_delivery: false,
  delivery_time: '',
  delivery_notes: '',
  address: '',
  address_notes: '',
  quantity: 0,
  flavors: Array.from({ length: 10 }, () => ({ name: '', qty: '' })),
  bag_type: '',
  stick_logo_color: '',
  sticker_image_url: '',
  csb_image_url: '',
  cart_style: '',
  cart_print: '',
  cart_sides: '',
  umbrella: '',
  toppings: ['', '', '', '', ''],
  status: 'pending',
};

const DRAFT_KEY = 'orderform_draft';

function loadDraft() {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveDraft(data) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function OrderForm() {
  const [data, setData] = useState(() => loadDraft() || { ...emptyOrder });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auto-save draft to sessionStorage on every change
  useEffect(() => { saveDraft(data); }, [data]);

  const createMutation = useMutation({
    mutationFn: (orderData) => {
      // Clean flavors and toppings
      const cleaned = {
        ...orderData,
        flavors: (orderData.flavors || []).filter(f => f.name?.trim()),
        toppings: (orderData.toppings || []).filter(t => t?.trim()),
        invoice: orderData.invoice || `INV-${Date.now().toString().slice(-6)}`,
      };
      return base44.entities.Order.create(cleaned);
    },
    onSuccess: (savedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order saved successfully!');
      clearDraft();
      setData({ ...emptyOrder });
      setTimeout(() => navigate('/orders'), 800);
    },
  });

  const handleSubmit = () => {
    if (!data.contact && !data.company && !data.brand) {
      toast.error('Please fill in at least a name or brand');
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="bg-card border border-border rounded shadow-lg overflow-hidden max-w-[800px] mx-auto">
      {/* Paper Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif font-bold text-2xl">
            C
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-semibold text-foreground">Invoice #</span>
          <Input
            value={data.invoice}
            onChange={e => setData({ ...data, invoice: e.target.value })}
            placeholder="__________"
            className="border-0 border-b border-border rounded-none bg-transparent px-1 focus-visible:ring-0 focus-visible:border-primary w-28 text-sm"
          />
        </div>
      </div>

      <ClientSection data={data} onChange={setData} />
      <EventSection data={data} onChange={setData} />
      <ServerDeliverySection data={data} onChange={setData} />
      <AddressSection data={data} onChange={setData} />
      <FlavorsSection data={data} onChange={setData} />
      <QuantitySection data={data} onChange={setData} />
      <SticksStickersSection data={data} onChange={setData} />
      <CartSection data={data} onChange={setData} />

      {/* Submit Bar */}
      <div className="p-4 bg-secondary border-t border-border flex justify-end gap-3">
        <Button variant="outline" onClick={() => { clearDraft(); setData({ ...emptyOrder }); }} className="text-muted-foreground">
          <RotateCcw className="w-4 h-4 mr-1.5" /> Clear Form
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
          <Check className="w-4 h-4 mr-1.5" /> {createMutation.isPending ? 'Saving...' : 'Submit Order'}
        </Button>
      </div>
    </div>
  );
}