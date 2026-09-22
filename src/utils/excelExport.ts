import * as XLSX from 'xlsx';
import { PushRecord, SegmentStat } from '../types';

export function getTimeSlotBucket(timeStr: string): string {
  if (!timeStr) return 'Não informado';
  const hour = parseInt(timeStr.split(':')[0] || '10', 10);
  if (hour >= 6 && hour < 12) return 'Manhã (06h - 12h)';
  if (hour >= 12 && hour < 14) return 'Almoço (12h - 14h)';
  if (hour >= 14 && hour < 18) return 'Tarde (14h - 18h)';
  if (hour >= 18 && hour < 22) return 'Noite (18h - 22h)';
  return 'Madrugada (22h - 06h)';
}

function mapRecordToRow(r: PushRecord) {
  const deliveryRate = r.sent > 0 ? (r.delivered / r.sent) * 100 : 0;
  const openRate = r.delivered > 0 ? (r.opened / r.delivered) * 100 : 0;
  const ctr = r.delivered > 0 ? (r.clicked / r.delivered) * 100 : 0;
  const convRate = r.clicked > 0 ? (r.converted / r.clicked) * 100 : 0;

  return {
    'ID': r.id,
    'PÚBLICO': r.segment,
    'PRÉVIA': r.previa || r.messageBody,
    'DATA DE ENVIO': r.date,
    'HORÁRIO': r.time,
    'QTD ENVIADA': r.sent,
    'ABERTAS': r.opened,
    'FATURAMENTO ESTIMADO (R$)': r.revenue,
    'COMPRAS EM 24H': r.converted,
    'Status': r.status,
    'Faixa de Horário': getTimeSlotBucket(r.time),
    'Entregues': r.delivered,
    'Taxa Entrega (%)': Number(deliveryRate.toFixed(2)),
    'Taxa Abertura (%)': Number(openRate.toFixed(2)),
    'Cliques (Acessos)': r.clicked,
    'CTR (%)': Number(ctr.toFixed(2)),
    'Taxa Conversão (%)': Number(convRate.toFixed(2)),
    'Título do Push': r.messageTitle,
    'Texto do Push': r.messageBody,
    'Link / Destino': r.targetUrl || ''
  };
}

const defaultColWidths = [
  { wch: 12 }, // ID
  { wch: 25 }, // PÚBLICO
  { wch: 38 }, // PRÉVIA
  { wch: 14 }, // DATA DE ENVIO
  { wch: 10 }, // HORÁRIO
  { wch: 14 }, // QTD ENVIADA
  { wch: 12 }, // ABERTAS
  { wch: 24 }, // FATURAMENTO ESTIMADO
  { wch: 16 }, // COMPRAS EM 24H
  { wch: 14 }, // Status
  { wch: 22 }, // Faixa de Horário
  { wch: 14 }, // Entregues
  { wch: 16 }, // Taxa Entrega
  { wch: 16 }, // Taxa Abertura
  { wch: 16 }, // Cliques
  { wch: 12 }, // CTR
  { wch: 18 }, // Taxa Conversão
  { wch: 35 }, // Título
  { wch: 45 }, // Mensagem
  { wch: 25 }  // Link
];

export function exportToExcel(records: PushRecord[], segments: SegmentStat[]) {
  const wb = XLSX.utils.book_new();

  // Tab 1: ABA DE ENTREGUES (Disparos já enviados e entregues com sucesso)
  const deliveredRecords = records.filter((r) => r.status === 'Entregue');
  const deliveredRows = (deliveredRecords.length > 0 ? deliveredRecords : records).map(mapRecordToRow);
  const wsDelivered = XLSX.utils.json_to_sheet(deliveredRows);
  wsDelivered['!cols'] = defaultColWidths;
  XLSX.utils.book_append_sheet(wb, wsDelivered, 'Aba de Entregues');

  // Tab 2: Disparos Agendados (Disparos futuros programados)
  const scheduledRecords = records.filter((r) => r.status === 'Agendado');
  if (scheduledRecords.length > 0) {
    const scheduledRows = scheduledRecords.map(mapRecordToRow);
    const wsScheduled = XLSX.utils.json_to_sheet(scheduledRows);
    wsScheduled['!cols'] = defaultColWidths;
    XLSX.utils.book_append_sheet(wb, wsScheduled, 'Disparos Agendados');
  }

  // Tab 3: Todos os Disparos
  const allRows = records.map(mapRecordToRow);
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = defaultColWidths;
  XLSX.utils.book_append_sheet(wb, wsAll, 'Todos os Disparos');

  // Tab 4: Resumo por Segmento
  const segmentData = segments.map((s) => ({
    'Segmento Alvo': s.segment,
    'Total de Campanhas': s.count,
    'Total Disparados': s.sent,
    'Total Entregues': s.delivered,
    'Taxa Média de Entrega (%)': Number(s.deliveryRate.toFixed(2)),
    'Total Aberturas': s.opened,
    'Taxa Média de Abertura (%)': Number(s.openRate.toFixed(2)),
    'Total Cliques': s.clicked,
    'CTR Médio (%)': Number(s.ctr.toFixed(2)),
    'Total Conversões': s.converted,
    'Taxa de Conversão (%)': Number(s.conversionRate.toFixed(2)),
    'Receita Gerada (R$)': s.revenue
  }));

  const wsSegments = XLSX.utils.json_to_sheet(segmentData);
  wsSegments['!cols'] = [
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSegments, 'Resumo por Segmento');

  // Tab 5: CTR por Faixa de Horário
  const timeBuckets: Record<string, { count: number; sent: number; delivered: number; opened: number; clicked: number }> = {
    'Manhã (06h - 12h)': { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Almoço (12h - 14h)': { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Tarde (14h - 18h)': { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Noite (18h - 22h)': { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
    'Madrugada (22h - 06h)': { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0 },
  };

  records.forEach((r) => {
    const bucket = getTimeSlotBucket(r.time);
    if (timeBuckets[bucket]) {
      timeBuckets[bucket].count += 1;
      timeBuckets[bucket].sent += r.sent;
      timeBuckets[bucket].delivered += r.delivered;
      timeBuckets[bucket].opened += r.opened;
      timeBuckets[bucket].clicked += r.clicked;
    }
  });

  const timeData = Object.entries(timeBuckets).map(([bucket, data]) => {
    const denom = data.delivered > 0 ? data.delivered : data.sent;
    const ctr = denom > 0 ? (data.clicked / denom) * 100 : 0;
    const openRate = denom > 0 ? (data.opened / denom) * 100 : 0;
    return {
      'Faixa de Horário': bucket,
      'Campanhas': data.count,
      'Total Disparos': data.sent,
      'Total Entregues': data.delivered,
      'Total Aberturas': data.opened,
      'Taxa Abertura (%)': Number(openRate.toFixed(2)),
      'Total Cliques': data.clicked,
      'CTR Médio (%)': Number(ctr.toFixed(2)),
    };
  });

  const wsTime = XLSX.utils.json_to_sheet(timeData);
  wsTime['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTime, 'CTR por Faixa Horária');

  // Export file
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `painel_push_segmentado_${today}.xlsx`);
}
