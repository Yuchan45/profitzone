import { useEffect, useState } from 'react'
import { fetchRentals } from '../services/rentals.service.js'

// Solo los avisos con dirección real se pueden ubicar en el mapa: la mayoría del scraping
// quedó en el centro de su barrio y apilaría decenas de puntos en un lugar falso
const PLACEABLE_PRECISIONS = ['exact', 'intersection']

const IDLE = { status: 'idle', data: null, error: null }

/**
 * Avisos de alquiler con dirección real dentro del círculo, del más cercano al más lejano,
 * para la capa "Alquileres" del mapa del análisis y su lista en la tarjeta de alquiler.
 * No busca sin punto. status: 'idle' | 'loading' | 'ok' | 'error'.
 */
export function useRentalListings({ lat, lng, radius }) {
  const enabled = lat != null && lng != null && Boolean(radius)
  // `forKey` evita mostrar los avisos de otro punto mientras llegan los nuevos
  const key = `${lat},${lng},${radius}`
  const [state, setState] = useState({ ...IDLE, forKey: null })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const forKey = `${lat},${lng},${radius}`

    fetchRentals({ lat, lng, radius })
      .then((data) => {
        if (cancelled) return
        const listings = (data.places ?? []).filter((place) =>
          PLACEABLE_PRECISIONS.includes(place.locationPrecision),
        )
        setState({ status: 'ok', data: listings, error: null, forKey })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forKey,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled, lat, lng, radius])

  if (!enabled) return IDLE
  if (state.forKey !== key) return { status: 'loading', data: null, error: null }
  return { status: state.status, data: state.data, error: state.error }
}
