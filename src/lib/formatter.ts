import { Place } from '../services/places';

export function capitalizeText(text: string): string {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRouteMessage(places: Place[], carreta: string, observacaoGeral?: string) {
  let message = `Segue programação:\n\n🚚 Carreta: ${carreta}\n\n`;

  if (observacaoGeral) {
    message += `📋 Observação Geral: ${observacaoGeral}\n\n`;
  }

  places.forEach((place, index) => {
    message += `🎯 ${index + 1}ª Parada: ${place.nomeFantasia}\n`;
    message += `📍 Endereço: ${place.linkGoogleMaps}\n`;
    if (place.observacao) {
      message += `❗ Observação: ${place.observacao}\n`;
    }
    
    if (index < places.length - 1) {
      message += `────────────────────\n\n`;
    } else {
      message += `────────────────────\n`;
    }
  });

  message += `\n⚠️ Importante: Após o engate, conferir documentação, condições do veículo e horário de atendimento de cada destino antes de seguir viagem. *Boa viagem e dirija com segurança.*`;

  return message;
}
