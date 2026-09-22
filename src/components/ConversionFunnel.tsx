import React from 'react';
import {
  Send,
  Eye,
  MousePointer,
  Award,
  DollarSign,
  TrendingDown,
  Sparkles,
  Info
} from 'lucide-react';
import { MetricSummary } from '../types';

interface ConversionFunnelProps {
  summary: MetricSummary;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ summary }) => {
  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const stages = [
    {
      label: '1. Disparados',
      sublabel: 'Envios solicitados',
      count: summary.totalSent,
      isCurrency: false,
      percentOfTotal: 100,
      stepDropPercent: summary.totalSent > 0 ? ((summary.totalSent - summary.totalOpened) / summary.totalSent) * 100 : 0,
      dropLabel: 'Dispensados / Sem abertura',
      icon: Send,
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      barColor: 'bg-indigo-500',
    },
    {
      label: '2. Aberturas',
      sublabel: 'Visualizados na tela',
      count: summary.totalOpened,
      isCurrency: false,
      percentOfTotal: summary.totalSent > 0 ? (summary.totalOpened / summary.totalSent) * 100 : 0,
      stepDropPercent: summary.totalOpened > 0 ? ((summary.totalOpened - summary.totalClicked) / summary.totalOpened) * 100 : 0,
      dropLabel: 'Não clicaram no CTA',
      icon: Eye,
      color: 'bg-sky-600',
      lightColor: 'bg-sky-50 border-sky-200 text-sky-700',
      barColor: 'bg-sky-500',
    },
    {
      label: '3. Cliques',
      sublabel: 'Acesso via Deep Link',
      count: summary.totalClicked,
      isCurrency: false,
      percentOfTotal: summary.totalSent > 0 ? (summary.totalClicked / summary.totalSent) * 100 : 0,
      stepDropPercent: summary.totalClicked > 0 ? ((summary.totalClicked - summary.totalConverted) / summary.totalClicked) * 100 : 0,
      dropLabel: 'Abandono dentro do app',
      icon: MousePointer,
      color: 'bg-amber-600',
      lightColor: 'bg-amber-50 border-amber-200 text-amber-700',
      barColor: 'bg-amber-500',
    },
    {
      label: '4. Conversões',
      sublabel: 'Ações finais concluídas',
      count: summary.totalConverted,
      isCurrency: false,
      percentOfTotal: summary.totalSent > 0 ? (summary.totalConverted / summary.totalSent) * 100 : 0,
      stepDropPercent: 0,
      dropLabel: `${summary.conversionRate.toFixed(1)}% conversão`,
      icon: Award,
      color: 'bg-violet-600',
      lightColor: 'bg-violet-50 border-violet-200 text-violet-700',
      barColor: 'bg-violet-500',
    },
    {
      label: '5. Receita Estimada',
      sublabel: 'Faturamento gerado',
      count: summary.totalRevenue,
      isCurrency: true,
      percentOfTotal: 100,
      stepDropPercent: 0,
      dropLabel: `Ticket Médio: ${formatCurrency(summary.avgOrderValue)}`,
      icon: DollarSign,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      barColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Funil de Conversão do Disparo de Push</span>
            <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Etapas ponta a ponta
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a retenção, taxa de perda entre etapas e o retorno financeiro gerado
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Taxa Global: <strong>{summary.totalSent > 0 ? ((summary.totalConverted / summary.totalSent) * 100).toFixed(2) : 0}%</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Receita Total: <strong>{formatCurrency(summary.totalRevenue)}</strong></span>
          </div>
        </div>
      </div>

      {/* Funnel Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div
              key={stage.label}
              className="relative flex flex-col justify-between bg-slate-50/60 rounded-xl p-3.5 border border-slate-200/70 hover:border-slate-300 transition"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {stage.label}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stage.lightColor} border`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {stage.isCurrency ? formatCurrency(stage.count) : formatNumber(stage.count)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stage.sublabel}
                </div>
              </div>

              {/* Progress bar and details */}
              <div className="mt-3 pt-3 border-t border-slate-200/60">
                {stage.isCurrency ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
                      <span>Ticket Médio</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(summary.avgOrderValue)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">
                        Retorno Financeiro Direto
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
                      <span>% do total</span>
                      <span className="font-bold text-slate-800">{stage.percentOfTotal.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stage.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(stage.percentOfTotal, 2)}%` }}
                      />
                    </div>

                    {/* Step indicator */}
                    {!isLast && idx < 3 ? (
                      <div className="mt-2 text-[10px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">
                          -{stage.stepDropPercent.toFixed(1)}% ({stage.dropLabel})
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-violet-700 bg-violet-50/80 px-2 py-1 rounded border border-violet-100 flex items-center gap-1">
                        <Award className="w-3 h-3 text-violet-600 shrink-0" />
                        <span className="truncate font-semibold">
                          {summary.conversionRate.toFixed(1)}% taxa s/ cliques
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
