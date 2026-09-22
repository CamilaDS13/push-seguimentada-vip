import Papa from 'papaparse';
import { PushRecord, PushChannel, PushStatus } from '../types';

function cleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  // Handle Brazilian currency / percentage formatting: R$ 1.234,56 or 1234.56 or percentages
  str = str.replace(/R\$|\$|%/g, '').trim();
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function cleanChannel(val: any): PushChannel {
  if (!val) {
    return 'Push App';
  }
  const str = String(val).toLowerCase().trim();
  if (str.includes('ios') || str.includes('apple') || str.includes('iphone')) return 'iOS';
  if (str.includes('android')) return 'Android';
  if (str.includes('web') || str.includes('browser') || str.includes('desktop')) return 'Web Push';
  return 'Push App';
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getSegmentCopy(segment: string) {
  const s = segment.toUpperCase();
  if (s.includes('ANIVERSARI')) {
    return {
      title: '🎂 Parabéns! Seu presente VIP está te esperando',
      body: 'Preparamos um cupom especial de aniversário para você comemorar com a gente no app!',
      tags: ['Aniversário', 'Fidelidade', 'VIP'],
    };
  }
  if (s.includes('60 DIAS')) {
    return {
      title: '❤️ Que saudade de você! Ganhe Frete Grátis hoje',
      body: 'Faz tempo que não te vemos! Volte e aproveite um benefício exclusivo no seu próximo pedido.',
      tags: ['Reativação', '60 Dias', 'Frete Grátis'],
    };
  }
  if (s.includes('30 DIAS')) {
    return {
      title: '✨ Temos novidades selecionadas para você',
      body: 'Confira os lançamentos e ofertas imperdíveis que separamos para o seu perfil no app.',
      tags: ['Retenção', '30 Dias', 'Novidades'],
    };
  }
  if (s.includes('IDOSO')) {
    return {
      title: '🛒 Desconto da semana e atendimento prioritário',
      body: 'Ofertas pensadas com carinho para você, com entrega facilitada e suporte dedicado.',
      tags: ['Idosos', 'Prioritário', 'Cuidado'],
    };
  }
  if (s.includes('NUNCA COMPRARAM') || s.includes('PRIMEIRA COMPRA')) {
    return {
      title: '🎁 Ganhe R$ 20 OFF no seu primeiro pedido',
      body: 'Experimente nosso app com desconto especial de boas-vindas usando o cupom BEMVINDOVIP.',
      tags: ['Boas-Vindas', 'Ativação', '1ª Compra'],
    };
  }
  return {
    title: `📲 Oferta Especial: ${segment}`,
    body: 'Toque para conferir descontos e novidades exclusivas liberadas agora no seu aplicativo.',
    tags: [segment, 'Campanha'],
  };
}

export function parsePushCsv(csvText: string): PushRecord[] {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (!parsed.data || parsed.data.length === 0) {
    return [];
  }

  const records: PushRecord[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const row: Record<string, any> = {};
    for (const key of Object.keys(raw)) {
      row[normalizeHeader(key)] = raw[key];
    }

    const seq = row.seq || String(i + 1);
    const segment = (
      row.publico ||
      row.segmento ||
      row.segment ||
      row.publicoalvo ||
      row.grupo ||
      'Base Geral'
    ).trim();

    // Skip empty dummy rows if all are blank
    if (!segment && !row.qtdenviada && !row.disparos && !row.datadeenvio) {
      continue;
    }

    const copy = getSegmentCopy(segment);

    const campaignName =
      row.campanha ||
      row.nome ||
      row.nomedacampanha ||
      row.campaign ||
      row.titulo ||
      `Push VIP: ${segment}`;

    const channel = cleanChannel(
      row.canal || row.channel || row.plataforma || row.platform || row.so
    );

    // Normalize Date: if DD/MM/YYYY, convert to YYYY-MM-DD for standard sort
    let date = (
      row.datadeenvio ||
      row.data ||
      row.date ||
      row.diadoenvio ||
      new Date().toISOString().split('T')[0]
    ).trim();

    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        date = `${year}-${month}-${day}`;
      }
    }

    const time = (
      row.horario ||
      row.hora ||
      row.time ||
      (i % 2 === 0 ? '10:00' : '18:30')
    ).trim();

    // Volume Sent (QTD ENVIADA)
    const sent = cleanNumber(
      row.qtdenviada ||
      row.disparos ||
      row.envios ||
      row.total ||
      row.sent ||
      row.volumedisparos ||
      row.totaldisparado
    );

    // Volume Delivered
    const delivered = cleanNumber(
      row.entregues ||
      row.entregue ||
      row.delivered ||
      row.volumeentregue ||
      sent
    );

    // Opened (ABERTAS)
    const opened = cleanNumber(
      row.abertas ||
      row.aberturas ||
      row.abertos ||
      row.opened ||
      row.visualizacoes
    );

    // Converted (COMPRAS EM 24H / CONVERSÕES)
    const converted = cleanNumber(
      row.comprasem24h ||
      row.comprasem24hrs ||
      row.compras24h ||
      row.compras24hrs ||
      row.compras ||
      row.conversoes ||
      row.conversao ||
      row.converted ||
      row.vendas ||
      row.pedidos
    );

    // Clicked (CLIQUES)
    const rawClicks = cleanNumber(
      row.cliques ||
      row.clique ||
      row.clicked ||
      row.clicks
    );
    const clicked = rawClicks > 0 ? rawClicks : Math.max(opened, converted);

    // Revenue / Faturamento (FATURAMENTO ESTIMADO)
    const rawRevenueStr =
      row.faturamentoestimado ??
      row.faturamento ??
      row.receitaestimada ??
      row.receita ??
      row.valortotal ??
      row.faturamentototal ??
      row.revenue;

    const hasExplicitRevenue = rawRevenueStr !== undefined && String(rawRevenueStr).trim() !== '';
    const parsedRevenue = cleanNumber(rawRevenueStr);

    // If FATURAMENTO ESTIMADO was explicitly filled in the sheet, respect the exact value
    // Otherwise calculate based on converted orders (~R$ 85 ticket) or 0
    const revenue = hasExplicitRevenue
      ? parsedRevenue
      : (converted > 0 ? converted * 85 : 0);

    // Status: If not sent yet, mark as 'Agendado'
    let status: PushStatus = 'Entregue';
    if (row.status || row.situacao) {
      const s = String(row.status || row.situacao).toLowerCase();
      if (s.includes('agen') || s.includes('sched')) status = 'Agendado';
      else if (s.includes('anda') || s.includes('prog')) status = 'Em andamento';
      else if (s.includes('falh')) status = 'Falha parcial';
      else status = 'Entregue';
    } else {
      status = sent > 0 ? 'Entregue' : 'Agendado';
    }

    // Message Preview (PREVIA) from spreadsheet
    const rawPrevia = (
      row.previa ||
      row.previadopush ||
      row.previadamsg ||
      row.previadamensagem ||
      row.textopush ||
      row.texto ||
      row.mensagem ||
      ''
    ).trim();

    let messageTitle = (
      row.titulodopush ||
      row.titulomensagem ||
      row.titulonotificacao ||
      ''
    ).trim();

    let messageBody = (
      row.textodopush ||
      row.copy ||
      row.body ||
      ''
    ).trim();

    // If PREVIA column was provided, link it to the push simulation and preview
    if (rawPrevia) {
      if (!messageTitle && !messageBody) {
        if (rawPrevia.includes('\n')) {
          const lines = rawPrevia.split('\n').map((l: string) => l.trim()).filter(Boolean);
          messageTitle = lines[0] || copy.title;
          messageBody = lines.slice(1).join(' ') || lines[0];
        } else if (rawPrevia.includes(': ')) {
          const parts = rawPrevia.split(': ');
          messageTitle = parts[0]?.trim() || copy.title;
          messageBody = parts.slice(1).join(': ').trim();
        } else if (rawPrevia.includes(' - ')) {
          const parts = rawPrevia.split(' - ');
          messageTitle = parts[0]?.trim() || copy.title;
          messageBody = parts.slice(1).join(' - ').trim();
        } else {
          messageTitle = copy.title;
          messageBody = rawPrevia;
        }
      } else if (!messageBody) {
        messageBody = rawPrevia;
      }
    }

    if (!messageTitle) messageTitle = copy.title;
    if (!messageBody) messageBody = rawPrevia || copy.body;

    const targetUrl = (
      row.url ||
      row.link ||
      row.deeplink ||
      row.targeturl ||
      `app://vip?segmento=${encodeURIComponent(segment)}`
    ).trim();

    const id = `PUSH-${String(seq).padStart(3, '0')}`;

    records.push({
      id,
      campaignName,
      segment,
      channel,
      date,
      time: time || '10:00',
      sent,
      delivered,
      opened,
      clicked,
      converted,
      revenue,
      status,
      previa: rawPrevia || messageBody,
      messageTitle,
      messageBody,
      targetUrl,
      tags: copy.tags,
    });
  }

  return records;
}
