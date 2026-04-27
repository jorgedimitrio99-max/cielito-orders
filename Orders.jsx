import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import OrderCard from '@/components/orders/OrderCard';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import PullToRefresh from '@/components/PullToRefresh';

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      toast.success('Order deleted');
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3 flex-shrink-0">
        <h1 className="font-serif text-2xl font-bold text-foreground">📋 All Orders</h1>
        <Link to="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 select-none-nav">
            <Plus className="w-4 h-4 mr-1" /> New Order
          </Button>
        </Link>
      </div>

      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isFetching}>
        <div className="pb-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-3">🍦</div>
              <div className="text-lg font-semibold mb-1">No orders yet</div>
              <div className="text-sm">Submit your first order and it will appear here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <OrderDetailModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onEdit={() => {
          navigate(`/edit/${selectedOrder.id}`);
          setSelectedOrder(null);
        }}
        onDelete={() => deleteMutation.mutate(selectedOrder.id)}
      />
    </div>
  );
}