import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import CalendarOrderModal from '@/components/calendar/CalendarOrderModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Distinct color palette for events
const EVENT_COLORS = [
  'bg-rose-200 text-rose-800 hover:bg-rose-300',
  'bg-sky-200 text-sky-800 hover:bg-sky-300',
  'bg-emerald-200 text-emerald-800 hover:bg-emerald-300',
  'bg-violet-200 text-violet-800 hover:bg-violet-300',
  'bg-amber-200 text-amber-800 hover:bg-amber-300',
  'bg-pink-200 text-pink-800 hover:bg-pink-300',
  'bg-teal-200 text-teal-800 hover:bg-teal-300',
  'bg-orange-200 text-orange-800 hover:bg-orange-300',
  'bg-indigo-200 text-indigo-800 hover:bg-indigo-300',
  'bg-lime-200 text-lime-800 hover:bg-lime-300',
];

function getColorForOrder(order, allOrders) {
  const idx = allOrders.findIndex(o => o.id === order.id);
  return EVENT_COLORS[idx % EVENT_COLORS.length];
}

export default function EventCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      (o.brand && o.brand.toLowerCase().includes(q)) ||
      (o.company && o.company.toLowerCase().includes(q)) ||
      (o.contact && o.contact.toLowerCase().includes(q)) ||
      (o.event_date && o.event_date.includes(q))
    );
  }, [orders, search]);

  // Jump to month if search matches a date pattern like "2026-05" or "may"
  const handleSearch = (val) => {
    setSearch(val);
    // detect month name
    const monthIdx = MONTHS.findIndex(m => m.toLowerCase().startsWith(val.toLowerCase().trim()));
    if (val.trim().length >= 3 && monthIdx !== -1) {
      setMonth(monthIdx);
      return;
    }
    // detect yyyy-mm
    const match = val.match(/(\d{4})-(\d{1,2})/);
    if (match) {
      setYear(parseInt(match[1]));
      setMonth(parseInt(match[2]) - 1);
    }
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const todayStr = now.toISOString().split('T')[0];

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false, dateStr: '' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, current: true, dateStr: ds, isToday: ds === todayStr });
  }
  const rem = cells.length % 7 ? 7 - (cells.length % 7) : 0;
  for (let d = 1; d <= rem; d++) {
    cells.push({ day: d, current: false, dateStr: '' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold text-foreground">📅 Event Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-serif text-lg font-semibold text-foreground min-w-[150px] text-center">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by brand, name, or date (e.g. May, 2026-05)…"
          className="pl-8 pr-8 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Legend */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filteredOrders.slice(0, 10).map((o, idx) => (
            <span key={o.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EVENT_COLORS[orders.findIndex(x => x.id === o.id) % EVENT_COLORS.length]}`}>
              {o.brand || o.company || o.contact || 'Event'}
            </span>
          ))}
          {filteredOrders.length > 10 && <span className="text-[10px] text-muted-foreground self-center">+{filteredOrders.length - 10} more</span>}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-accent border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="text-center py-2 text-[11px] font-semibold text-muted-foreground tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const events = cell.dateStr ? filteredOrders.filter(o => {
              if (!o.event_date) return false;
              const start = o.event_date;
              const end = o.multi_day && o.extra_dates?.[0] ? o.extra_dates[0] : start;
              return cell.dateStr >= start && cell.dateStr <= end;
            }) : [];

            return (
              <div
                key={i}
                className={`min-h-[72px] md:min-h-[80px] border-r border-b border-border/30 p-1 last:border-r-0 ${
                  !cell.current ? 'bg-background/50' : ''
                } ${cell.isToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`text-xs font-medium mb-0.5 ${
                  cell.isToday ? 'text-primary font-bold' : cell.current ? 'text-muted-foreground' : 'text-muted-foreground/40'
                }`}>
                  {cell.day}
                </div>
                {events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedOrder(ev)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium mb-0.5 truncate cursor-pointer transition-colors ${getColorForOrder(ev, orders)}`}
                    title={ev.brand || ev.company || ev.contact}
                  >
                    {(ev.brand || ev.company || ev.contact || 'Event').split(' ')[0]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <CalendarOrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}