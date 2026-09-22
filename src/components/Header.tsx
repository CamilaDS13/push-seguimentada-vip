import React from 'react';
import {
  RefreshCw,
  FileSpreadsheet,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  ExternalLink,
  Layers
} from 'lucide-react';
import { SyncState } from '../types';

interface HeaderProps {
  syncState: SyncState;
  onSync: () => void;
  onExportExcel: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncState,
  onSync,
  onExportExcel,
  onOpenSettings,
}) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca sincronizado';
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Painel de Push Segmentado
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Layers className="w-3 h-3" />
                  Analytics v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoramento de campanhas, funil de conversão e audiências segmentadas
              </p>
            </div>
          </div>

          {/* Sync Status Badge & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Status Pill */}
            <div
              onClick={onOpenSettings}
              title="Clique para configurar o link da planilha Google"
              className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                syncState.status === 'syncing'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : syncState.status === 'synced' && syncState.sourceType === 'online'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              {syncState.status === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Sincronizando dados...</span>
                </>
              ) : syncState.status === 'synced' && syncState.sourceType === 'online' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Planilha Conectada Online</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {syncState.sourceType === 'uploaded'
                      ? 'Arquivo CSV Carregado'
                      : 'Modo Demonstração (Link 404)'}
                  </span>
                </>
              )}

              <span className="text-slate-400">|</span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatLastSync(syncState.lastSyncTime)}
              </span>
            </div>

            {/* Sync Now Button */}
            <button
              id="btn-sync-sheet"
              onClick={onSync}
              disabled={syncState.status === 'syncing'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  syncState.status === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              <span>Sincronizar</span>
            </button>

            {/* Export to Excel Button */}
            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            {/* Sheet Link Config Button */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-98 transition border border-slate-200 cursor-pointer"
              title="Configurações da Planilha Google"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Planilha</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
