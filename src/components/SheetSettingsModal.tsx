import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  HelpCircle,
  Clock,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { SyncState } from '../types';

interface SheetSettingsModalProps {
  syncState: SyncState;
  isOpen: boolean;
  onClose: () => void;
  onSaveUrl: (newUrl: string, autoSyncMins: number) => void;
  onFileUpload: (file: File) => void;
  onTestConnection: (url: string) => Promise<{ success: boolean; message: string }>;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  syncState,
  isOpen,
  onClose,
  onSaveUrl,
  onFileUpload,
  onTestConnection,
}) => {
  const [urlInput, setUrlInput] = useState(syncState.sheetUrl);
  const [autoSync, setAutoSync] = useState(syncState.autoSyncMinutes);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(urlInput);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro ao conectar com o link fornecido.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveUrl(urlInput.trim(), autoSync);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Conexão da Planilha Google na Web
              </h3>
              <p className="text-xs text-slate-500">
                Configure a sincronização contínua com a sua planilha publicada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              URL da Planilha Publicada (CSV)
            </label>
            <div className="relative">
              <input
                type="text"
                id="input-sheet-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O link gerado pelo Google Sheets na opção <em>"Publicar na Web"</em> em formato CSV.
            </p>
          </div>

          {/* Test & Result */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <button
              id="btn-test-sheet-connection"
              type="button"
              onClick={handleTest}
              disabled={isTesting || !urlInput}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            {testResult && (
              <div
                className={`flex-1 p-2 rounded-lg border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="leading-snug">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Auto Sync Interval */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Intervalo de Sincronização Automática</span>
            </div>
            <p className="text-[11px] text-slate-500">
              O painel buscará novos dados inseridos na planilha automaticamente:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: 'Manual (Apenas ao clicar)', mins: 0 },
                { label: 'A cada 1 minuto', mins: 1 },
                { label: 'A cada 5 minutos', mins: 5 },
                { label: 'A cada 15 minutos', mins: 15 },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setAutoSync(opt.mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    autoSync === opt.mins
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Columns Guide matching user's sheet */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Colunas Vinculadas da Sua Planilha:</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Pronto para preenchimento
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">PUBLICO</strong>
                <span className="text-slate-500 text-[10px]">Segmento / Alvo</span>
              </div>
              <div className="bg-emerald-100/60 p-2 rounded-lg border border-emerald-300">
                <strong className="block text-emerald-950 font-bold">PREVIA ⭐</strong>
                <span className="text-emerald-800 text-[10px]">Texto / Cópia do push</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">DATA DE ENVIO</strong>
                <span className="text-slate-500 text-[10px]">Ex: 22/09/2026</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">HORARIO</strong>
                <span className="text-slate-500 text-[10px]">Ex: 14:30</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">QTD ENVIADA</strong>
                <span className="text-slate-500 text-[10px]">Disparos totais</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">ABERTAS</strong>
                <span className="text-slate-500 text-[10px]">Aberturas diretas</span>
              </div>
              <div className="bg-emerald-100/60 p-2 rounded-lg border border-emerald-300">
                <strong className="block text-emerald-950 font-bold">FATURAMENTO ESTIMADO ⭐</strong>
                <span className="text-emerald-800 text-[10px]">Receita gerada em R$</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <strong className="block text-slate-800">COMPRAS EM 24H</strong>
                <span className="text-slate-500 text-[10px]">Conversões finais</span>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 pt-0.5">
              Ao preencher <strong>PREVIA</strong> e <strong>FATURAMENTO ESTIMADO</strong> na sua planilha, o painel atualizará o simulador mobile e o faturamento automaticamente!
            </p>
          </div>

          {/* How to publish tutorial */}
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Como publicar sua planilha no Google Sheets corretamente:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-indigo-950 leading-relaxed pl-1">
              <li>
                No Google Sheets, clique no menu superior em <strong>Arquivo &gt; Compartilhar &gt; Publicar na Web</strong>.
              </li>
              <li>
                Na aba <strong>Link</strong>, no primeiro dropdown selecione o documento ou página desejada.
              </li>
              <li>
                No segundo dropdown, mude de "Página da Web" para <strong>Valores separados por vírgula (.csv)</strong>.
              </li>
              <li>
                Clique no botão <strong>Publicar</strong>. Se sua conta for institucional/Google Workspace, certifique-se de desmarcar a opção de exigir login da organização.
              </li>
              <li>
                Copie o link gerado e cole no campo acima.
              </li>
            </ol>
          </div>

          {/* Direct CSV / Excel upload alternative */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Ou Carregar Arquivo CSV / Excel Local
            </label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-700">
                  Clique ou arraste um arquivo CSV ou Excel aqui
                </span>
                <span className="text-[10px] text-slate-400">
                  Os dados serão carregados instantaneamente no painel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setUrlInput(
                'https://docs.google.com/spreadsheets/d/1HBwXdS87j0D6FLOgNlZhi-BdqQWnJAmtZVHHGE3PRes/gviz/tq?tqx=out:csv&sheet=P%C3%A1gina1'
              );
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
          >
            Usar Link Direto da Planilha "Push seguimentada VIP"
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Salvar e Sincronizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
