import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Smartphone,
  Eye,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { PushRecord } from '../types';

interface CampaignsTableProps {
  records: PushRecord[];
  onSelectCampaign: (campaign: PushRecord) => void;
  availableSegments: string[];
  activeStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function getTimeSlot(timeStr: string): { label: string; color: string; bucket: string } {
  if (!timeStr) {
    return { label: 'Não informado', color: 'bg-slate-100 text-slate-500 border-slate-200', bucket: 'Outro' };
  }
  const hour = parseInt(timeStr.split(':')[0] || '10', 10);
  if (hour >= 6 && hour < 12) {
    return { label: 'Manhã (06h-12h)', color: 'bg-amber-50 text-amber-700 border-amber-200', bucket: 'Manhã' };
  } else if (hour >= 12 && hour < 14) {
    return { label: 'Almoço (12h-14h)', color: 'bg-orange-50 text-orange-700 border-orange-200', bucket: 'Almoço' };
  } else if (hour >= 14 && hour < 18) {
    return { label: 'Tarde (14h-18h)', color: 'bg-sky-50 text-sky-700 border-sky-200', bucket: 'Tarde' };
  } else if (hour >= 18 && hour < 22) {
    return { label: 'Noite (18h-22h)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', bucket: 'Noite' };
  } else {
    return { label: 'Madrugada (22h-06h)', color: 'bg-purple-50 text-purple-700 border-purple-200', bucket: 'Madrugada' };
  }
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  records,
  onSelectCampaign,
  availableSegments,
  activeStatusFilter,
  onStatusFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [internalStatus, setInternalStatus] = useState<string>('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof PushRecord | 'deliveryRate' | 'openRate' | 'ctr' | 'convRate'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const currentStatus = activeStatusFilter !== undefined ? activeStatusFilter : internalStatus;
  const setStatus = (status: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    } else {
      setInternalStatus(status);
    }
  };

  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const deliveredCount = useMemo(() => records.filter((r) => r.status === 'Entregue').length, [records]);
  const scheduledCount = useMemo(() => records.filter((r) => r.status === 'Agendado').length, [records]);
  const deliveredTotalSent = useMemo(
    () => records.filter((r) => r.status === 'Entregue').reduce((acc, r) => acc + r.sent, 0),
    [records]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.messageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.messageBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.time.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSegment =
        selectedSegment === 'all' || r.segment === selectedSegment;

      const matchStatus =
        currentStatus === 'all' || r.status === currentStatus;

      const timeSlot = getTimeSlot(r.time);
      const matchTimeSlot =
        selectedTimeSlot === 'all' || timeSlot.bucket === selectedTimeSlot;

      return matchSearch && matchSegment && matchStatus && matchTimeSlot;
    });
  }, [records, searchTerm, selectedSegment, currentStatus, selectedTimeSlot]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'deliveryRate') {
        aVal = a.sent > 0 ? a.delivered / a.sent : 0;
        bVal = b.sent > 0 ? b.delivered / b.sent : 0;
      } else if (sortField === 'openRate') {
        aVal = a.delivered > 0 ? a.opened / a.delivered : 0;
        bVal = b.delivered > 0 ? b.opened / b.delivered : 0;
      } else if (sortField === 'ctr') {
        aVal = a.delivered > 0 ? a.clicked / a.delivered : 0;
        bVal = b.delivered > 0 ? b.clicked / b.delivered : 0;
      } else if (sortField === 'convRate') {
        aVal = a.clicked > 0 ? a.converted / a.clicked : 0;
        bVal = b.clicked > 0 ? b.converted / b.clicked : 0;
      } else {
        aVal = a[sortField as keyof PushRecord] ?? '';
        bVal = b[sortField as keyof PushRecord] ?? '';
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredRecords, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Abas Rápidas de Navegação / Visualização */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="tab-all-campaigns"
            onClick={() => {
              setStatus('all');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Todos os Disparos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {records.length}
            </span>
          </button>

          {/* Dedicated Tab: ABA DE ENTREGUES */}
          <button
            type="button"
            id="tab-entregues"
            onClick={() => {
              setStatus('Entregue');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentStatus === 'Entregue'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aba de Entregues</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentStatus === 'Entregue' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              {deliveredCount}
            </span>
          </button>

          {/* Dedicated Tab: AGENDADOS */}
          <button
            type="button"
            id="tab-agendados"
            onClick={() => {
              setStatus('Agendado');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentStatus === 'Agendado'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Disparos Agendados</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentStatus === 'Agendado' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-800'
              }`}
            >
              {scheduledCount}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500">
          Mostrando <strong>{filteredRecords.length}</strong> de {records.length} campanhas
        </div>
      </div>

      {/* Banner Informativo quando na Aba de Entregues */}
      {currentStatus === 'Entregue' && (
        <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Aba de Entregues Selecionada:</strong> Visualizando as <strong>{deliveredCount} campanhas</strong> que já foram enviadas, somando <strong>{formatNumber(deliveredTotalSent)} notificações entregues com sucesso</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatus('all')}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer shrink-0 ml-2"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Table Toolbar & Secondary Filters */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-campaigns"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por público (ex: ANIVERSARIANTES), horário ou texto..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Faixa de Horário Filter */}
            <select
              id="filter-timeslot"
              value={selectedTimeSlot}
              onChange={(e) => {
                setSelectedTimeSlot(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todas as Faixas de Horário</option>
              <option value="Manhã">☀️ Manhã (06h - 12h)</option>
              <option value="Almoço">🍽️ Almoço (12h - 14h)</option>
              <option value="Tarde">🌤️ Tarde (14h - 18h)</option>
              <option value="Noite">🌙 Noite (18h - 22h)</option>
              <option value="Madrugada">⭐ Madrugada (22h - 06h)</option>
            </select>

            {/* Segment Filter */}
            <select
              id="filter-segment"
              value={selectedSegment}
              onChange={(e) => {
                setSelectedSegment(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todos os Públicos / Segmentos ({records.length})</option>
              {availableSegments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('campaignName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Campanha & Público</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              {/* Separate Column: STATUS */}
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              {/* Separate Column: DATA */}
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Data</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              {/* Dedicated Column: HORÁRIO & FAIXA */}
              <th
                onClick={() => handleSort('time')}
                className="py-3 px-3 cursor-pointer hover:bg-indigo-100/60 transition bg-indigo-50/40 text-indigo-900 border-x border-indigo-100"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Horário & Faixa</span>
                  <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sent')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Qtd. Enviada</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('deliveryRate')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Entrega (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('openRate')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Abertas (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ctr')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>CTR Aberturas</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('convRate')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Compras 24h</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('revenue')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Faturamento Estimado</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Prévia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <ListFilter className="w-6 h-6 text-slate-300" />
                    <span>Nenhum disparo encontrado para os filtros selecionados.</span>
                    {currentStatus !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setStatus('all')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline mt-1 cursor-pointer"
                      >
                        Exibir todas as campanhas
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item) => {
                const deliveryRate = item.sent > 0 ? (item.delivered / item.sent) * 100 : 0;
                const openRate = item.delivered > 0 ? (item.opened / item.delivered) * 100 : 0;
                const ctr = item.delivered > 0 ? (item.clicked / item.delivered) * 100 : 0;
                const convRate = item.clicked > 0 ? (item.converted / item.clicked) * 100 : 0;
                const timeSlot = getTimeSlot(item.time);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectCampaign(item)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition group"
                  >
                    {/* Campaign & Segment */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                        {item.campaignName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag className="w-2.5 h-2.5" />
                          {item.segment}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.id}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: STATUS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          item.status === 'Entregue'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Agendado'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : item.status === 'Em andamento'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.status === 'Entregue' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.status === 'Agendado' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Column 3: DATA */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {item.date}
                    </td>

                    {/* Column 4: DEDICATED HORÁRIO & FAIXA */}
                    <td className="py-3 px-3 whitespace-nowrap bg-indigo-50/30 border-x border-indigo-100/60">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-xs">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>{item.time || '10:00'}</span>
                        </div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${timeSlot.color}`}
                        >
                          {timeSlot.bucket}
                        </span>
                      </div>
                    </td>

                    {/* Qtd. Enviada */}
                    <td className="py-3 px-3 text-right font-medium text-slate-900">
                      {item.sent > 0 ? formatNumber(item.sent) : <span className="text-slate-400 italic">Pendente</span>}
                    </td>

                    {/* Delivered */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-medium text-slate-800">
                        {item.sent > 0 ? `${deliveryRate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.sent > 0 ? formatNumber(item.delivered) : 'Aguardando'}
                      </div>
                    </td>

                    {/* Opened */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-medium text-sky-700">
                        {item.delivered > 0 ? `${openRate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.opened > 0 ? formatNumber(item.opened) : '0'}
                      </div>
                    </td>

                    {/* CTR */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-amber-700">
                        {item.delivered > 0 ? `${ctr.toFixed(2)}%` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatNumber(item.clicked)} aberturas
                      </div>
                    </td>

                    {/* Conversion */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-medium text-emerald-700">
                        {item.converted > 0 ? `${formatNumber(item.converted)} comp.` : '0'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.clicked > 0 ? `${convRate.toFixed(1)}% conv.` : '0%'}
                      </div>
                    </td>

                    {/* Faturamento Estimado */}
                    <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                      {item.revenue > 0 ? (
                        <span className="text-emerald-700 font-bold">{formatCurrency(item.revenue)}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Prévia */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCampaign(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition cursor-pointer"
                        title="Clique para ver a prévia e simulação do push no celular"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Ver Push</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Mostrando{' '}
          <strong className="text-slate-800">
            {filteredRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </strong>{' '}
          a{' '}
          <strong className="text-slate-800">
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
          </strong>{' '}
          de <strong className="text-slate-800">{filteredRecords.length}</strong> campanhas
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-medium text-slate-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
