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

export function formatRouteMessage(
  places: RouteStop[], 
  placa: string, 
  observacaoGeral?: string,
  operacaoGeral?: string,
  agendamentoGeral?: string
) {
  let message = `*Segue programação:*\n\n*Placa/Carreta:* ${placa}\n`;
  if (operacaoGeral) {
    message += `*Operação:* ${operacaoGeral}\n`;
  }
  if (agendamentoGeral) {
    message += `*Agendamento:* ${formatDateToBR(agendamentoGeral)}\n`;
  }
  
  message += `\n`;

  if (observacaoGeral) {
    message += `*Observação Geral:* ${observacaoGeral}\n\n`;
  }

  places.forEach((place, index) => {
    message += `*${index + 1}ª Parada:* ${place.nomeFantasia}\n`;
    
    if (place.operacao) {
      message += `*Operação:* ${place.operacao}\n`;
    }
    if (place.agendamento) {
      message += `*Agendamento:* ${formatDateToBR(place.agendamento)}\n`;
    }
    
    if (place.endereco) {
      message += `*Endereço:* ${place.endereco}\n`;
      message += `*Maps:* ${place.linkGoogleMaps}\n`;
    } else {
      message += `*Endereço:* ${place.linkGoogleMaps}\n`;
    }
    
    if (place.observacoes && place.observacoes.length > 0) {
      place.observacoes.forEach(obs => {
        message += `*${obs.categoria}:* ${obs.texto}\n`;
      });
    } else if (place.observacao) {
      message += `*Observação:* ${place.observacao}\n`;
    }
    
    if (index < places.length - 1) {
      message += `--------------------\n\n`;
    } else {
      message += `--------------------\n`;
    }
  });

  message += `\n*Importante:* Após o engate, conferir documentação, condições do veículo e horário de atendimento de cada destino antes de seguir viagem. _Boa viagem e dirija com segurança._`;

  return message;
}

