import { Place } from '../services/places';
import { RouteStop } from '../services/routes';

export function capitalizeText(text: string): string {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDateToBR(dateString: string): string {
  if (!dateString) return dateString;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  } catch(e) {
    return dateString;
  }
}

export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function formatPlaceInfoText(place: Place): string {
  let text = `*${place.nomeFantasia}*\n`;
  if (place.nomeRazaoSocial) text += `*Razão Social:* ${place.nomeRazaoSocial}\n`;
  if (place.cidade) text += `*Cidade:* ${place.cidade}\n`;
  if (place.linkGoogleMaps) text += `*Maps:* ${ensureAbsoluteUrl(place.linkGoogleMaps)}\n`;
  
  if (place.observacoes && place.observacoes.length > 0) {
    place.observacoes.forEach(obs => {
      text += `*${obs.categoria}:* ${obs.texto}\n`;
    });
  } else if (place.observacao) {
    text += `*Observação:* ${place.observacao}\n`;
  }
  
  return text.trim();
}

export function formatRouteMessage(
  places: RouteStop[], 
  placa: string,
  placa2?: string,
  observacaoGeral?: string,
  operacaoGeral?: string,
  agendamentoGeral?: string,
  aguardaCarretaVazia?: boolean
) {
  const hour = new Date().getHours();
  let greeting = 'Boa noite';
  if (hour >= 5 && hour < 12) {
    greeting = 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
  }

  const formatPlateForMessage = (p: string) => p.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  let plateString = formatPlateForMessage(placa);
  if (placa2) {
    plateString += ` / ${formatPlateForMessage(placa2)}`;
  }
  
  if (aguardaCarretaVazia) {
    plateString = `Sem carreta (Aguardar avisar qual carreta engatar)\n\n*OBSERVAÇÃO OPERACIONAL:* Aguardar até passar a informação da carreta vazia para seguir para o carregamento.`;
  }

  let message = `${greeting},\n\nSegue sua próxima programação:\n\n🚚 Carreta: ${aguardaCarretaVazia ? "" : plateString}\n\n`;
  if (aguardaCarretaVazia) {
     message = `${greeting},\n\nSegue sua próxima programação:\n\n🚚 ${plateString}\n\n`;
  }

  const numberIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  places.forEach((place, index) => {
    const icon = index < 10 ? numberIcons[index] : `${index + 1}️⃣`;
    const rawOp = place.operacao || operacaoGeral || 'Operação';
    const opType = rawOp.charAt(0).toUpperCase() + rawOp.slice(1).toLowerCase();
    
    message += `${icon} ${opType}: ${place.nomeFantasia}\n`;
    
    if (place.cidade) {
      message += `🏙️ Cidade: ${place.cidade}\n`;
    }
    
    const agendamento = places.length === 1 && agendamentoGeral ? agendamentoGeral : place.agendamento;
    if (agendamento) {
      message += `🕒 Agenda: ${formatDateToBR(agendamento)}\n`;
    }

    if (place.linkGoogleMaps) {
      message += `📍 Maps: ${ensureAbsoluteUrl(place.linkGoogleMaps)}\n`;
    }
    
    let obsList: string[] = [];
    if (place.observacao) {
      obsList.push(place.observacao);
    }
    if (place.observacoes && place.observacoes.length > 0) {
      place.observacoes.forEach(o => obsList.push(`${o.categoria}: ${o.texto}`));
    }
    if (obsList.length > 0) {
      message += `📝 ${obsList.join(' | ')}\n`;
    }
    
    message += `\n`;
  });

  if (observacaoGeral) {
    message += `📝 Observações gerais:\n${observacaoGeral}\n\n`;
  }

  message += `⚠️ Após o engate, conferir documentação, condições do veículo e horário de atendimento de cada destino antes de seguir viagem.`;

  return message;
}

