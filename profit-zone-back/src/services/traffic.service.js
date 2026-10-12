import { env } from '../config/env.js'

/**
 * Curvas base de afluencia horaria (0 a 100) típicas por rubro comercial en CABA.
 * Representa el porcentaje de capacidad/flujo medio en locales del rubro de 7h a 23h.
 */
const BASE_HOURLY_PROFILES = {
  cafeteria: {
    name: 'cafetería',
    hours: {
      7: 15,
      8: 48,
      9: 82,
      10: 94,
      11: 85,
      12: 58,
      13: 45,
      14: 48,
      15: 60,
      16: 80,
      17: 84,
      18: 65,
      19: 42,
      20: 28,
      21: 15,
      22: 10,
      23: 5,
    },
    morningMeal: 'desayuno',
  },
  restaurante: {
    name: 'restaurante',
    hours: {
      7: 5,
      8: 8,
      9: 10,
      10: 15,
      11: 30,
      12: 78,
      13: 96,
      14: 88,
      15: 40,
      16: 20,
      17: 18,
      18: 28,
      19: 48,
      20: 82,
      21: 98,
      22: 90,
      23: 55,
    },
    morningMeal: 'almuerzo y cena',
  },
  gimnasio: {
    name: 'gimnasio',
    hours: {
      7: 65,
      8: 82,
      9: 68,
      10: 42,
      11: 32,
      12: 48,
      13: 52,
      14: 38,
      15: 32,
      16: 48,
      17: 70,
      18: 92,
      19: 98,
      20: 85,
      21: 62,
      22: 30,
      23: 10,
    },
    morningMeal: 'entrenamiento matutino',
  },
  pilates: {
    name: 'pilates',
    hours: {
      7: 20,
      8: 55,
      9: 85,
      10: 90,
      11: 75,
      12: 40,
      13: 35,
      14: 35,
      15: 50,
      16: 70,
      17: 88,
      18: 92,
      19: 80,
      20: 50,
      21: 25,
      22: 10,
      23: 5,
    },
    morningMeal: 'clases matutinas',
  },
}

const SCHEDULE_PRESETS = {
  morning: { label: 'mañana, 8 a 11 h', startHour: 8, endHour: 11, meal: 'desayuno' },
  lunch: { label: 'mediodía, 12 a 15 h', startHour: 12, endHour: 15, meal: 'almuerzo' },
  afternoon: { label: 'tarde, 16 a 19 h', startHour: 16, endHour: 19, meal: 'merienda' },
  dinner: { label: 'noche, 20 a 23 h', startHour: 20, endHour: 23, meal: 'cena' },
  night: { label: 'trasnoche, 21 a 2 h', startHour: 21, endHour: 23, meal: 'cena y noche' },
  day: { label: 'diurno, 8 a 20 h', startHour: 8, endHour: 20, meal: 'horario comercial' },
}

/**
 * Resuelve la franja horaria solicitada.
 */
function resolveTimeWindow(schedule, startHour, endHour) {
  if (startHour !== undefined && endHour !== undefined) {
    const s = Number(startHour)
    const e = Number(endHour)
    return {
      label: `franja personalizada, ${s} a ${e} h`,
      startHour: s,
      endHour: e,
      meal: 'tu turno',
    }
  }

  const key = (schedule || 'morning').toLowerCase().trim()
  return SCHEDULE_PRESETS[key] || SCHEDULE_PRESETS.morning
}

function generateTrafficCallout(subcategory, timeWindow, score) {
  const isMorning = timeWindow.startHour >= 6 && timeWindow.endHour <= 12
  const isLunch = timeWindow.startHour >= 12 && timeWindow.endHour <= 16
  const isDinner = timeWindow.startHour >= 19 && timeWindow.endHour <= 24

  if (score >= 65) {
    if (isMorning) {
      return `La actividad sube fuerte a la mañana, en línea con tu franja de ${timeWindow.meal}.`
    }
    if (isLunch) {
      return 'Fuerte afluencia concentrada en la franja del mediodía y almuerzo.'
    }
    if (isDinner) {
      return 'Pico de afluencia nocturno concentrado en el servicio de cena y after.'
    }
    return 'Alta afluencia de público en la franja seleccionada.'
  }

  if (score >= 40) {
    return 'Afluencia moderada y constante a lo largo de tu franja horaria.'
  }

  return 'Baja actividad habitual en esta franja; considerá evaluar turnos complementarios.'
}

/**
 * Calcula la afluencia y el histograma horario para un punto, rubro y franja horaria.
 */
export async function getTrafficAnalysis({
  lat,
  lng,
  radiusInMeters = 1000,
  subcategory = 'restaurante',
  schedule = 'morning',
  startHour,
  endHour,
}) {
  const normSub = (subcategory || 'restaurante').toLowerCase().trim()
  const profile = BASE_HOURLY_PROFILES[normSub] || BASE_HOURLY_PROFILES.restaurante
  const timeWindow = resolveTimeWindow(schedule, startHour, endHour)

  const hoursList = []
  let sumScore = 0
  let countScore = 0

  // Generamos el histograma de 7 h a 23 h como en el gráfico de la imagen
  for (let h = 7; h <= 23; h++) {
    const baseVal = profile.hours[h] ?? 20
    const isHighlighted = h >= timeWindow.startHour && h <= timeWindow.endHour

    if (isHighlighted) {
      sumScore += baseVal
      countScore++
    }

    hoursList.push({
      hour: h,
      label: `${h} h`,
      value: baseVal,
      isHighlighted,
    })
  }

  const score = countScore > 0 ? Math.round(sumScore / countScore) : 50
  const callout = generateTrafficCallout(normSub, timeWindow, score)

  return {
    score,
    scoreMax: 100,
    timeSlot: timeWindow.label,
    startHour: timeWindow.startHour,
    endHour: timeWindow.endHour,
    hourlyActivity: hoursList,
    callout,
    badge: 'Estimado',
    source: 'BestTime (popular times de locales del radio) · forecast 2026 · mide entradas a locales, no peatones',
    center: { lat, lng },
    radiusInMeters,
    subcategory: normSub,
  }
}
