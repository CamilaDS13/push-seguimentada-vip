import React from 'react';
import {
  CheckCircle2,
  Eye,
  MousePointerClick,
  ShoppingBag,
  DollarSign,
  Percent,
  Sparkles
} from 'lucide-react';
import { MetricSummary } from '../types';

interface KpiCardsProps {
  summary: MetricSummary;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, activeFilter, onFilterChange }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Volume & Taxa de Entrega - ABA DE ENTREGUES SHORTCUT */}
      <div
        id="card-taxa-entrega"
        onClick={() => onFilterChange?.(activeFilter === 'Entregue' ? null : 'Entregue')}
        className={`bg-white rounded-xl p-4 border transition-all group relative overflow-hidden cursor-pointer ${
          activeFilter === 'Entregue'
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 shadow-md'
            : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300'
        }`}
        title="Clique para abrir a Aba de Entregues"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-xl" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Entregues
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
              Aba
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatNumber(summary.totalDelivered)}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
            <Percent className="w-3 h-3" />
            {summary.deliveryRate.toFixed(1)}% taxa
          </span>
          <span className="text-emerald-700 text-[11px] font-semibold hover:underline">
            {activeFilter === 'Entregue' ? 'Ativo ✓' : 'Ver aba →'}
          </span>
        </div>
      </div>

      {/* 3. Aberturas & Taxa de Abertura */}
      <div
        id="card-taxa-abertura"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-300 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500 rounded-t-xl" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Aberturas Diretas
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatNumber(summary.totalOpened)}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-100">
            {summary.openRate.toFixed(1)}% taxa
          </span>
          <span className="text-slate-400 text-[11px]">S/ entregues</span>
        </div>
      </div>

      {/* 4. Cliques & CTR */}
      <div
        id="card-cliques-ctr"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-xl" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Cliques (CTR)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatNumber(summary.totalClicked)}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-100">
            {summary.ctr.toFixed(2)}% CTR
          </span>
          <span className="text-slate-400 text-[11px]">Engajamento</span>
        </div>
      </div>

      {/* 5. Conversões */}
      <div
        id="card-conversoes"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-violet-300 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500 rounded-t-xl" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Conversões
          </span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatNumber(summary.totalConverted)}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-bold border border-violet-100">
            {summary.conversionRate.toFixed(1)}% taxa
          </span>
          <span className="text-slate-400 text-[11px]">S/ cliques</span>
        </div>
      </div>

      {/* 6. Receita Estimada */}
      <div
        id="card-receita-total"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Receita Estimada
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(summary.totalRevenue)}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
            <Sparkles className="w-3 h-3" />
            Ticket Médio
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            {formatCurrency(summary.avgOrderValue)}
          </span>
        </div>
      </div>
    </div>
  );
};
