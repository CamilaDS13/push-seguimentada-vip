import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Send,
  Eye,
  MousePointer,
  ShoppingBag,
  DollarSign,
  Share2,
  ExternalLink,
  Bell,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PushRecord } from '../types';

interface PushPreviewModalProps {
  campaign: PushRecord | null;
  onClose: () => void;
}

export const PushPreviewModal: React.FC<PushPreviewModalProps> = ({
  campaign,
  onClose,
}) => {
  const [deviceOs, setDeviceOs] = useState<'ios' | 'android'>('ios');

  if (!campaign) return null;

  const deliveryRate = campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0;
  const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
  const ctr = campaign.delivered > 0 ? (campaign.clicked / campaign.delivered) * 100 : 0;
  const convRate = campaign.clicked > 0 ? (campaign.converted / campaign.clicked) * 100 : 0;

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Realistic Mobile Preview */}
        <div className="md:w-1/2 bg-slate-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* OS Switcher */}
          <div className="mb-4 flex items-center gap-1 bg-slate-800/90 border border-slate-700 p-1 rounded-xl z-10">
            <button
              onClick={() => setDeviceOs('ios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                deviceOs === 'ios'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>Apple iOS</span>
            </button>
            <button
              onClick={() => setDeviceOs('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                deviceOs === 'android'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[280px] sm:w-[300px] h-[520px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col justify-between relative overflow-hidden">
            {/* Notch / Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>

            {/* Lockscreen Header (Clock, Date) */}
            <div className="pt-10 text-center text-white z-10">
              <div className="text-[11px] font-medium text-slate-300">
                Terça-feira, 22 de setembro
              </div>
              <div className="text-4xl font-light tracking-tight mt-1">
                {campaign.time || '10:45'}
              </div>
            </div>

            {/* Push Notification Bubble */}
            <div className="my-auto z-10 w-full">
              {deviceOs === 'ios' ? (
                /* iOS Glass Style Notification */
                <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/80 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                        P
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wide">
                        SEU APP
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">agora</span>
                  </div>

                  <div className="text-xs font-bold text-white mb-1 leading-snug">
                    {campaign.messageTitle}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {campaign.messageBody}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
                    <span className="hover:underline cursor-pointer">Ver Oferta</span>
                    <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Fechar</span>
                  </div>
                </div>
              ) : (
                /* Android Material Style Notification */
                <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950 text-[9px] font-bold">
                        P
                      </div>
                      <span className="text-[11px] font-medium text-slate-300">Seu App • agora</span>
                    </div>
                    <Bell className="w-3 h-3 text-slate-400" />
                  </div>

                  <div className="text-xs font-bold text-slate-100 mb-0.5">
                    {campaign.messageTitle}
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-3">
                    {campaign.messageBody}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-semibold text-emerald-400">
                      ACESSAR AGORA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Swipe Indicator */}
            <div className="pb-2 flex justify-center z-10">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Side: Campaign Details & Analytics */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                  {campaign.segment}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                  {campaign.campaignName}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono">{campaign.id}</span> • Canal: <strong>{campaign.channel}</strong> • Enviado em: {campaign.date} às {campaign.time}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Push Copy Details */}
            <div className="my-4 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Conteúdo do Push (Prévia)
                </span>
                {campaign.previa && (
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Vinculado à Coluna PREVIA
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-800 mb-1">
                {campaign.messageTitle}
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                {campaign.messageBody}
              </div>
              {campaign.targetUrl && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs text-indigo-600 flex items-center gap-1 font-mono">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{campaign.targetUrl}</span>
                </div>
              )}
            </div>

            {/* Campaign Performance Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Métricas Destaque do Disparo
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Sent & Delivered */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Envios / Entregas
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatNumber(campaign.delivered)} / {formatNumber(campaign.sent)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    {deliveryRate.toFixed(1)}% taxa de sucesso
                  </div>
                </div>

                {/* Open Rate */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Aberturas Diretas
                  </div>
                  <div className="text-sm font-bold text-sky-700 mt-0.5">
                    {formatNumber(campaign.opened)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {openRate.toFixed(1)}% taxa s/ entrega
                  </div>
                </div>

                {/* CTR */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Cliques & CTR
                  </div>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">
                    {formatNumber(campaign.clicked)} cliques
                  </div>
                  <div className="text-[11px] font-bold text-amber-600">
                    {ctr.toFixed(2)}% CTR
                  </div>
                </div>

                {/* Converted & Faturamento Estimado */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Faturamento Estimado
                  </div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {campaign.revenue > 0 ? formatCurrency(campaign.revenue) : '—'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {formatNumber(campaign.converted)} compras 24h ({convRate.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Close */}
          <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
