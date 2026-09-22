import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PushRecord, SegmentStat } from '../types';
import { BarChart3, PieChart as PieIcon, Clock, Sparkles } from 'lucide-react';

interface PerformanceChartsProps {
  records: PushRecord[];
  segmentStats: SegmentStat[];
  onSelectStatusFilter?: (status: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  records,
  segmentStats,
}) => {
  // 1. Volume Distribution by Segment
  const totalVolumeSent = records.reduce((acc, r) => acc + r.sent, 0);

  const segmentVolumeData = segmentStats
    .filter((s) => s.sent > 0 || s.count > 0)
    .map((s, idx) => ({
      name: s.segment,
      sent: s.sent,
      count: s.count,
      color: COLORS[idx % COLORS.length],
      percent: totalVolumeSent > 0 ? (s.sent / totalVolumeSent) * 100 : 0,
    }));

  // 3. Time of Day Performance
  const timeBuckets: Record<string, { bucket: string; icon: string; count: number; sent: number; delivered: number; opened: number; clicked: number }> = {
    'Manhã (06h - 12h)': { bucket: 'Manhã (06h - 12h)', icon: '☀️', count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Almoço (12h - 14h)': { bucket: 'Almoço (12h - 14h)', icon: '🍽️', count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Tarde (14h - 18h)': { bucket: 'Tarde (14h - 18h)', icon: '🌤️', count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Noite (18h - 22h)': { bucket: 'Noite (18h - 22h)', icon: '🌙', count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Madrugada (22h - 06h)': { bucket: 'Madrugada (22h - 06h)', icon: '⭐', count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
  };

  records.forEach((r) => {
    const hour = parseInt(r.time?.split(':')[0] || '10', 10);
    let key = 'Manhã (06h - 12h)';
    if (hour >= 6 && hour < 12) key = 'Manhã (06h - 12h)';
    else if (hour >= 12 && hour < 14) key = 'Almoço (12h - 14h)';
    else if (hour >= 14 && hour < 18) key = 'Tarde (14h - 18h)';
    else if (hour >= 18 && hour < 22) key = 'Noite (18h - 22h)';
    else key = 'Madrugada (22h - 06h)';

    timeBuckets[key].count += 1;
    timeBuckets[key].sent += r.sent;
    timeBuckets[key].delivered += r.delivered;
    timeBuckets[key].opened += r.opened;
    timeBuckets[key].clicked += r.clicked;
  });

  const timeData = Object.values(timeBuckets).map((tb) => {
    const baseDenom = tb.delivered > 0 ? tb.delivered : tb.sent;
    const ctr = baseDenom > 0 ? Number(((tb.clicked / baseDenom) * 100).toFixed(2)) : 0;
    return {
      bucket: tb.bucket,
      icon: tb.icon,
      count: tb.count,
      ctr,
      sent: tb.sent,
      clicks: tb.clicked,
    };
  });

  const maxCtr = Math.max(...timeData.map((t) => t.ctr), 0.1);
  const bestTimeSlot = [...timeData].sort((a, b) => b.ctr - a.ctr)[0];

  // Custom tooltips
  const customNumberFormat = (val: any) => new Intl.NumberFormat('pt-BR').format(Number(val));

  return (
    <div className="space-y-4">
      {/* Top Row: Segment Performance & Volume Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Segment Performance Comparison (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <span>Desempenho por Segmento Alvo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativo de CTR (%) e Taxa de Conversão (%) para priorização de audiências
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              <Sparkles className="w-3 h-3" />
              Melhor CTR: VIP & Carrinho
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  dataKey="segment"
                  type="category"
                  width={140}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="ctr" name="CTR (%)" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={16} />
                <Bar dataKey="conversionRate" name="Conversão (%)" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume dos Disparos Donut (1 col) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600" />
                <span>Volume dos Disparos</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição do volume de envios por segmento
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
              {customNumberFormat(totalVolumeSent)} envios
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentVolumeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="sent"
                  nameKey="name"
                >
                  {segmentVolumeData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${customNumberFormat(val)} envios`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900">{customNumberFormat(totalVolumeSent)}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Volume Total</span>
            </div>
          </div>

          {/* Volume by segment list */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs max-h-36 overflow-y-auto pr-1">
            {segmentVolumeData.slice(0, 4).map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900">{customNumberFormat(item.sent)}</span>
                  <span className="text-[10px] text-slate-400 block">{item.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTR Médio por Faixa de Horário */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>CTR Médio por Faixa de Horário</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Engajamento calculado pelo horário cadastrado de cada disparo na planilha
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
            Análise de Conversão por Horário
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-3">
          {timeData.map((item) => {
            const widthPct = item.ctr > 0 ? Math.max((item.ctr / maxCtr) * 100, 10) : item.count > 0 ? 5 : 0;
            return (
              <div key={item.bucket} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    <span>{item.bucket.split(' ')[0]}</span>
                  </span>
                  <span className={`font-bold text-xs ${item.ctr > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {item.sent > 0 ? `${item.ctr.toFixed(2)}% CTR` : item.count > 0 ? 'Agendado' : '0.00%'}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.ctr > 0
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                        : item.count > 0
                        ? 'bg-indigo-300'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.count} {item.count === 1 ? 'disparo' : 'disparos'}</span>
                  <span>{item.sent > 0 ? `${customNumberFormat(item.sent)} envios` : 'Aguardando'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-600 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/70">
          💡 <strong>Dica tática:</strong>{' '}
          {bestTimeSlot && bestTimeSlot.ctr > 0 ? (
            <>
              A faixa com maior interação atual é <strong>{bestTimeSlot.bucket}</strong> com <strong>{bestTimeSlot.ctr.toFixed(2)}% de CTR</strong>.
            </>
          ) : (
            <>
              Cadastre os horários das campanhas para identificar as faixas que geram maior taxa de abertura e conversão.
            </>
          )}
        </div>
      </div>
    </div>
  );
};
