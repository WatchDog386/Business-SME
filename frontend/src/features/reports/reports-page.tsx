import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, CalendarDays, ChevronDown, Download, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';
import { DateRangeField, useDateRange } from './date-range';
import { ProfitLossPanel } from './profit-loss-panel';
import { DailySummaryPanel } from './daily-summary-panel';
import { ProductPerformancePanel } from './product-performance-panel';
import { cn } from '@/lib/utils';
import { reportsApi } from '@/api/endpoints';

const tabs = [
  { id: 'profit', label: 'Profit & loss', icon: TrendingUp, iconColor: 'text-emerald-600' },
  { id: 'daily', label: 'Daily summary', icon: CalendarDays, iconColor: 'text-sky-600' },
  { id: 'products', label: 'Top products', icon: BarChart3, iconColor: 'text-purple-600' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function ReportsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<TabId>('profit');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const range = useDateRange();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (fmt: 'xlsx' | 'pdf' | 'docx') => {
    setExportOpen(false);
    const from = range.from;
    const to = range.to;
    const base = `report-${active}-${from}-to-${to}`;
    try {
      if (active === 'profit') {
        const d = await reportsApi.profitLoss({ from, to });
        const rows = [
          ['Profit & Loss', `Period ${from} to ${to}`],
          ['Sales revenue', d.revenue],
          ['COGS', -d.cogs],
          ['Gross profit', d.grossProfit],
          ['Operating expenses', -d.operatingExpenses],
          ['Net profit', d.netProfit],
          ['Gross margin %', d.grossMargin],
          ['Net margin %', d.netMargin],
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        if (fmt === 'xlsx') download(csv, `${base}.csv`, 'text/csv');
        else if (fmt === 'pdf') window.print();
        else download(csv, `${base}.txt`, 'text/plain');
      } else if (active === 'daily') {
        const d = await reportsApi.dailySummary({ from, to });
        const header = 'Date,Revenue,COGS,Expenses,NetProfit';
        const csv = [header, ...d.map((r) => `${r.date},${r.revenue},${r.cogs},${r.expenses},${r.netProfit}`)].join('\n');
        if (fmt === 'xlsx') download(csv, `${base}.csv`, 'text/csv');
        else if (fmt === 'pdf') window.print();
        else download(csv, `${base}.txt`, 'text/plain');
      } else {
        const d = await reportsApi.productPerformance({ from, to });
        const header = 'Product,Sold,Revenue,Profit';
        const csv = [header, ...d.map((r) => `${r.name},${r.quantity},${r.revenue},${r.profit}`)].join('\n');
        if (fmt === 'xlsx') download(csv, `${base}.csv`, 'text/csv');
        else if (fmt === 'pdf') window.print();
        else download(csv, `${base}.txt`, 'text/plain');
      }
    } catch {}
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="relative flex h-12 items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-tight text-foreground">Reports</h1>
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-black px-4 text-xs font-medium text-white hover:bg-zinc-900"
          >
            <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-2xl border border-edge bg-surface shadow-xl animate-scale-in">
              <button onClick={() => handleExport('xlsx')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel (.csv)
              </button>
              <button onClick={() => handleExport('pdf')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                <FileText className="h-4 w-4 text-red-600" /> PDF
              </button>
              <button onClick={() => handleExport('docx')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                <FileText className="h-4 w-4 text-sky-600" /> Docx (.txt)
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-foreground-4">See your profit clearly — revenue, costs and what you keep.</p>

      <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex h-9 shrink-0 snap-start items-center justify-center gap-1.5 rounded-full border px-5 text-xs font-medium tracking-wide transition-all active:scale-[0.97]',
                isActive ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-edge bg-surface text-foreground-2 hover:bg-surface-2',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : (tab as any).iconColor)} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <DateRangeField from={range.from} to={range.to} onFromChange={range.setFrom} onToChange={range.setTo} />

      {active === 'profit' && <ProfitLossPanel from={range.from} to={range.to} />}
      {active === 'daily' && <DailySummaryPanel from={range.from} to={range.to} />}
      {active === 'products' && <ProductPerformancePanel from={range.from} to={range.to} />}
    </div>
  );
}
