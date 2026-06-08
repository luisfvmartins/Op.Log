import { Place } from '../../../services/places';

export function formatRouteMessage(places: Place[], carreta: string, observacaoGeral?: string) {
  let message = `Segue programação:\n\n🚚 Carreta: ${carreta}\n\n`;

  if (observacaoGeral) {
    message += `📋 Observação Geral:\n${observacaoGeral}\n\n`;
  }

  places.forEach((place, index) => {
    message += `🎯 ${index + 1}ª Parada: ${place.nomeFantasia}\n`;
    message += `📍 Endereço:\n${place.linkGoogleMaps}\n`;
    if (place.observacao) {
      message += `❗ Observação:\n${place.observacao}\n`;
    }
    
    if (index < places.length - 1) {
      message += `────────────────────\n\n`;
    } else {
      message += `────────────────────\n`;
    }
  });

  message += `\n⚠️ Importante:\nApós o engate/chegada, conferir documentação, condições do veículo e horário de atendimento de cada destino antes de seguir viagem.\nBoa viagem e dirija com segurança.`;

  return message;
}
