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
  agendamentoGeral?: string
) {
  let message = `*Resumo da Operação*\n\n`;
  if (operacaoGeral) {
    message += `*Tipo de Operação:* ${operacaoGeral}\n\n`;
  }
  
  message += `*Locais:*\n`;
  places.forEach((place, index) => {
    message += `${index + 1}. ${place.nomeFantasia}`;
    
    // Use either the place-specific agendamento or the global one if there's only 1 place
    const agendamento = places.length === 1 && agendamentoGeral ? agendamentoGeral : place.agendamento;
    if (agendamento) {
      message += ` - ${formatDateToBR(agendamento)}`;
    }
    message += `\n`;

    if (place.linkGoogleMaps) {
      message += `   Maps: ${ensureAbsoluteUrl(place.linkGoogleMaps)}\n`;
    }
  });

  message += `\n*Implementos:*\n`;
  message += `Carreta 1: ${placa}\n`;
  if (placa2) {
    message += `Carreta 2: ${placa2}\n`;
  }

  if (observacaoGeral) {
    message += `\n*Observações:*\n${observacaoGeral}\n`;
  }

  message += `\n*Importante:* Após o engate, conferir documentação, condições do veículo e horário de atendimento de cada destino antes de seguir viagem. _Boa viagem e dirija com segurança._`;

  return message;
}

