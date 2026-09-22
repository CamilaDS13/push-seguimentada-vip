export type PushChannel = 'Push App' | 'Android' | 'iOS' | 'Web Push' | 'Multicanal';

export type PushStatus = 'Entregue' | 'Em andamento' | 'Agendado' | 'Falha parcial';

export interface PushRecord {
  id: string;
  campaignName: string;
  segment: string;
  channel: PushChannel;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  status: PushStatus;
  previa?: string; // Conteúdo direto da coluna PREVIA da planilha
  messageTitle: string;
  messageBody: string;
  targetUrl?: string;
  tags?: string[];
}

export interface MetricSummary {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalRevenue: number;
  deliveryRate: number; // %
  openRate: number; // %
  ctr: number; // %
  conversionRate: number; // %
  avgOrderValue: number;
}

export interface SegmentStat {
  segment: string;
  count: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  deliveryRate: number;
  openRate: number;
  ctr: number;
  conversionRate: number;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'fallback';
  lastSyncTime: Date | null;
  recordsCount: number;
  sourceType: 'online' | 'fallback' | 'uploaded';
  sheetUrl: string;
  errorMessage?: string;
  autoSyncMinutes: number; // 0 = manual, 1 = 1min, 5 = 5min, 15 = 15min
}
