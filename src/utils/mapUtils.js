// Função para calcular distância entre dois pontos (Haversine)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance; // Distância em metros
}

// Função para decodificar polyline do Google
export function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

// Função para obter ícone de manobra
export function getManeuverIcon(maneuver) {
  switch (maneuver) {
    case 'turn-right':
      return 'arrow-right';
    case 'turn-left':
      return 'arrow-left';
    case 'uturn-right':
    case 'uturn-left':
      return 'undo';
    case 'roundabout-right':
    case 'roundabout-left':
      return 'sync';
    case 'merge':
      return 'compress-arrows-alt';
    case 'fork-right':
    case 'fork-left':
      return 'code-branch';
    case 'straight':
    default:
      return 'arrow-up';
  }
} 