import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { ConversionFunnel } from './components/ConversionFunnel';
import { PerformanceCharts } from './components/PerformanceCharts';
import { CampaignsTable } from './components/CampaignsTable';
import { PushPreviewModal } from './components/PushPreviewModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { PushRecord, SegmentStat, MetricSummary, SyncState } from './types';
import { SAMPLE_PUSH_CAMPAIGNS, INITIAL_SHEET_URL } from './data/mockData';
import { parsePushCsv } from './utils/csvParser';
import { exportToExcel } from './utils/excelExport';
import {
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Calendar,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

function getCandidateUrls(inputUrl: string): string[] {
  const urls: string[] = [];
  const match = inputUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{20,})/);
  if (match && match[1] && match[1] !== 'e') {
    const id = match[1];
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=P%C3%A1gina1`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`);
  }
  if (inputUrl.includes('/pubhtml')) {
    urls.push(inputUrl.replace('/pubhtml', '/pub?output=csv'));
  }
  urls.push(inputUrl);
  // Also add verified working endpoint as backup
  urls.push('https://docs.google.com/spreadsheets/d/1HBwXdS87j0D6FLOgNlZhi-BdqQWnJAmtZVHHGE3PRes/gviz/tq?tqx=out:csv&sheet=P%C3%A1gina1');
  return Array.from(new Set(urls));
}

export default function App() {
  const [records, setRecords] = useState<PushRecord[]>(SAMPLE_PUSH_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<PushRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all' = Consolidado, or 'YYYY-MM'

  const [syncState, setSyncState] = useState<SyncState>(() => {
    const savedUrl = localStorage.getItem('push_sheet_url');
    const savedAutoSync = localStorage.getItem('push_auto_sync');
    // If the saved URL is the old broken 2PACX URL, upgrade it to the working direct link
    const effectiveUrl =
      savedUrl && !savedUrl.includes('2PACX-1vTUAfZN')
        ? savedUrl
        : INITIAL_SHEET_URL;

    return {
      status: 'idle',
      lastSyncTime: new Date(),
      recordsCount: SAMPLE_PUSH_CAMPAIGNS.length,
      sourceType: 'online',
      sheetUrl: effectiveUrl,
      autoSyncMinutes: savedAutoSync ? parseInt(savedAutoSync, 10) : 1,
    };
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Synchronize with Google Sheet
  const syncWithSheet = useCallback(
    async (urlToFetch?: string, isInitial: boolean = false) => {
      const targetUrl = urlToFetch || syncState.sheetUrl;
      setSyncState((prev) => ({ ...prev, status: 'syncing' }));

      const candidateUrls = getCandidateUrls(targetUrl);
      let csvText = '';
      let fetchedOk = false;

      for (const candUrl of candidateUrls) {
        try {
          // 1. Try proxy
          const proxyUrl = `/api/sync-sheet?url=${encodeURIComponent(candUrl)}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && !text.includes('<!DOCTYPE html>') && !text.includes('Page Not Found')) {
              csvText = text;
              fetchedOk = true;
              break;
            }
          }
        } catch (e) {
          // continue
        }

        try {
          // 2. Try direct fetch
          const directRes = await fetch(candUrl);
          if (directRes.ok) {
            const text = await directRes.text();
            if (text && !text.includes('<!DOCTYPE html>') && !text.includes('Page Not Found')) {
              csvText = text;
              fetchedOk = true;
              break;
            }
          }
        } catch (e) {
          // continue
        }
      }

      if (fetchedOk && csvText) {
        const parsed = parsePushCsv(csvText);
        if (parsed.length > 0) {
          setRecords(parsed);
          setSyncState((prev) => ({
            ...prev,
            status: 'synced',
            lastSyncTime: new Date(),
            recordsCount: parsed.length,
            sourceType: 'online',
            errorMessage: undefined,
          }));
          if (!isInitial) {
            showToast(`${parsed.length} disparos sincronizados da planilha "Push seguimentada VIP"!`, 'success');
          }
          return { success: true, count: parsed.length };
        }
      }

      // If all candidates failed
      setSyncState((prev) => ({
        ...prev,
        status: 'fallback',
        lastSyncTime: new Date(),
        recordsCount: records.length,
        sourceType: prev.sourceType === 'uploaded' ? 'uploaded' : 'fallback',
        errorMessage: 'A planilha informada ainda não foi publicada publicamente no Google Sheets (Erro 404).',
      }));

      if (!isInitial) {
        showToast(
          'A planilha não pôde ser lida online. Verifique as configurações de acesso.',
          'error'
        );
      }
      return { success: false, message: 'Planilha não encontrada ou não publicada' };
    },
    [syncState.sheetUrl, records.length]
  );

  // Initial Sync on load
  useEffect(() => {
    syncWithSheet(syncState.sheetUrl, true);
  }, []);

  // Auto-sync timer
  useEffect(() => {
    if (syncState.autoSyncMinutes <= 0) return;
    const intervalMs = syncState.autoSyncMinutes * 60 * 1000;
    const timer = setInterval(() => {
      syncWithSheet();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [syncState.autoSyncMinutes, syncWithSheet]);

  // Detect available months in the records dataset
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, number>();
    records.forEach((r) => {
      if (r.date) {
        const ym = r.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          monthsMap.set(ym, (monthsMap.get(ym) || 0) + 1);
        }
      }
    });

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return Array.from(monthsMap.entries())
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        const mIdx = parseInt(month, 10) - 1;
        const label = mIdx >= 0 && mIdx < 12 ? `${monthNames[mIdx]} de ${year}` : key;
        const shortLabel = mIdx >= 0 && mIdx < 12 ? `${monthNames[mIdx].slice(0, 3)}/${year}` : key;
        return { key, count, label, shortLabel, year: parseInt(year, 10), month: parseInt(month, 10) };
      })
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [records]);

  // Filter records by selected period (Consolidado 'all' vs specific month 'YYYY-MM')
  const periodRecords = useMemo(() => {
    if (selectedPeriod === 'all') return records;
    return records.filter((r) => r.date?.startsWith(selectedPeriod));
  }, [records, selectedPeriod]);

  // Aggregated KPIs Summary (calculated over periodRecords)
  const summary: MetricSummary = useMemo(() => {
    const totalSent = periodRecords.reduce((acc, r) => acc + r.sent, 0);
    const totalDelivered = periodRecords.reduce((acc, r) => acc + r.delivered, 0);
    const totalOpened = periodRecords.reduce((acc, r) => acc + r.opened, 0);
    const totalClicked = periodRecords.reduce((acc, r) => acc + r.clicked, 0);
    const totalConverted = periodRecords.reduce((acc, r) => acc + r.converted, 0);
    const totalRevenue = periodRecords.reduce((acc, r) => acc + r.revenue, 0);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const ctr = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    const conversionRate = totalClicked > 0 ? (totalConverted / totalClicked) * 100 : 0;
    const avgOrderValue = totalConverted > 0 ? totalRevenue / totalConverted : 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalConverted,
      totalRevenue,
      deliveryRate,
      openRate,
      ctr,
      conversionRate,
      avgOrderValue,
    };
  }, [periodRecords]);

  // Aggregated Segment Stats (calculated over periodRecords)
  const segmentStats: SegmentStat[] = useMemo(() => {
    const map: Record<string, SegmentStat> = {};

    periodRecords.forEach((r) => {
      const seg = r.segment || 'Base Geral';
      if (!map[seg]) {
        map[seg] = {
          segment: seg,
          count: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0,
          deliveryRate: 0,
          openRate: 0,
          ctr: 0,
          conversionRate: 0,
        };
      }

      map[seg].count += 1;
      map[seg].sent += r.sent;
      map[seg].delivered += r.delivered;
      map[seg].opened += r.opened;
      map[seg].clicked += r.clicked;
      map[seg].converted += r.converted;
      map[seg].revenue += r.revenue;
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        deliveryRate: s.sent > 0 ? (s.delivered / s.sent) * 100 : 0,
        openRate: s.delivered > 0 ? (s.opened / s.delivered) * 100 : 0,
        ctr: s.delivered > 0 ? (s.clicked / s.delivered) * 100 : 0,
        conversionRate: s.clicked > 0 ? (s.converted / s.clicked) * 100 : 0,
      }))
      .sort((a, b) => b.sent - a.sent);
  }, [periodRecords]);

  const availableSegments = useMemo(() => {
    return Array.from(new Set(periodRecords.map((r) => r.segment))).filter(Boolean);
  }, [periodRecords]);

  const deliveredCount = useMemo(() => periodRecords.filter((r) => r.status === 'Entregue').length, [periodRecords]);
  const scheduledCount = useMemo(() => periodRecords.filter((r) => r.status === 'Agendado').length, [periodRecords]);

  // Handlers
  const handleExportExcel = () => {
    try {
      exportToExcel(periodRecords, segmentStats);
      showToast('Relatório de campanhas exportado em Excel (.xlsx) com sucesso!', 'success');
    } catch (e: any) {
      showToast(`Erro ao exportar Excel: ${e.message}`, 'error');
    }
  };

  const handleSaveSheetUrl = (newUrl: string, autoSyncMins: number) => {
    localStorage.setItem('push_sheet_url', newUrl);
    localStorage.setItem('push_auto_sync', String(autoSyncMins));
    setSyncState((prev) => ({
      ...prev,
      sheetUrl: newUrl,
      autoSyncMinutes: autoSyncMins,
    }));
    syncWithSheet(newUrl);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (!content) return;

        let parsed: PushRecord[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(content, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
          parsed = parsePushCsv(csvText);
        } else {
          parsed = parsePushCsv(content as string);
        }

        if (parsed.length > 0) {
          setRecords(parsed);
          setSyncState((prev) => ({
            ...prev,
            status: 'synced',
            lastSyncTime: new Date(),
            recordsCount: parsed.length,
            sourceType: 'uploaded',
          }));
          showToast(`Arquivo "${file.name}" importado com ${parsed.length} campanhas!`, 'success');
        } else {
          showToast('Nenhuma linha válida identificada no arquivo.', 'error');
        }
      } catch (err: any) {
        showToast(`Erro ao ler arquivo: ${err.message}`, 'error');
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleTestConnection = async (testUrl: string) => {
    try {
      const proxyUrl = `/api/sync-sheet?url=${encodeURIComponent(testUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<!DOCTYPE html>') || text.includes('Page Not Found')) {
          return {
            success: false,
            message: 'O link foi alcançado, mas o Google retornou "Arquivo não encontrado". Certifique-se de clicar em "Publicar" no Google Sheets.',
          };
        }
        return {
          success: true,
          message: 'Conexão estabelecida com sucesso! A planilha retornou dados válidos.',
        };
      }
      return {
        success: false,
        message: `Servidor retornou status HTTP ${res.status}. Verifique se o link está público.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Falha ao testar conexão.',
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        syncState={syncState}
        onSync={() => syncWithSheet()}
        onExportExcel={handleExportExcel}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Info Notice when using fallback due to Google 404 */}
      {syncState.sourceType === 'fallback' && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Aviso de Conexão:</strong> O link da planilha retornou Erro 404 (Ainda não foi publicada na web ou requer login). O painel está exibindo dados ilustrativos completos.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-amber-800 hover:text-amber-950 font-bold underline inline-flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>Ver como publicar ou trocar link</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        {/* Period Selector & Dashboard Scope Controller */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* View Mode: Consolidado vs Por Mês */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Visualização:</span>
              </span>

              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedPeriod === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Consolidado (Todos os Meses)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedPeriod === 'all' && availableMonths.length > 0) {
                      setSelectedPeriod(availableMonths[0].key);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedPeriod !== 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Por Mês</span>
                </button>
              </div>

              {/* Month Pills / Selector if "Por Mês" is active */}
              {selectedPeriod !== 'all' && (
                <div className="flex items-center gap-1.5 flex-wrap ml-1">
                  {availableMonths.length <= 4 ? (
                    availableMonths.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedPeriod(m.key)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                          selectedPeriod === m.key
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{m.shortLabel}</span>
                        <span className="text-[10px] text-slate-400">({m.count})</span>
                      </button>
                    ))
                  ) : (
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      {availableMonths.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} ({m.count} campanhas)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Source indicator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fonte: {syncState.sourceType === 'online' ? 'Google Sheets' : syncState.sourceType === 'uploaded' ? 'CSV Local' : 'Demonstração'}</span>
              </button>
            </div>
          </div>

          {/* Sub-bar with Scope indicators and Quick Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Visualizando: <strong className="text-slate-900">{selectedPeriod === 'all' ? 'Consolidado (Todos os Meses)' : availableMonths.find((m) => m.key === selectedPeriod)?.label || selectedPeriod}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong>{periodRecords.length}</strong> campanhas no recorte
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong>{availableSegments.length}</strong> segmentos
              </span>
            </div>

            {/* Quick Status Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStatusFilter('all')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  activeStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({periodRecords.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveStatusFilter('Entregue')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeStatusFilter === 'Entregue'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Aba de Entregues ({deliveredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStatusFilter('Agendado')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeStatusFilter === 'Agendado'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <span>Agendados ({scheduledCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Visual Conversion Funnel (including Receita Estimada card) */}
        <section>
          <ConversionFunnel summary={summary} />
        </section>

        {/* 2. Performance & Deep Analytics Charts */}
        <section>
          <PerformanceCharts
            records={periodRecords}
            segmentStats={segmentStats}
            onSelectStatusFilter={(s) => setActiveStatusFilter(s)}
          />
        </section>

        {/* 3. Interactive Campaigns Table */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Tabela de Disparos Segmentados
              </h2>
              {activeStatusFilter === 'Entregue' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Aba de Entregues
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              Clique em qualquer campanha para abrir o simulador de Push
            </span>
          </div>
          <CampaignsTable
            records={periodRecords}
            onSelectCampaign={(c) => setSelectedCampaign(c)}
            availableSegments={availableSegments}
            activeStatusFilter={activeStatusFilter}
            onStatusFilterChange={(s) => setActiveStatusFilter(s)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-12 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
              P
            </div>
            <span className="font-semibold text-slate-700">Painel de Disparo de Push Segmentado</span>
            <span>— Sincronização contínua com Google Sheets e exportação XLSX</span>
          </div>
          <div className="text-slate-400">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </footer>

      {/* Push Preview Phone Simulator Modal */}
      {selectedCampaign && (
        <PushPreviewModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Sheet Settings Modal */}
      <SheetSettingsModal
        syncState={syncState}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveUrl={handleSaveSheetUrl}
        onFileUpload={handleFileUpload}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}
