import { useEffect, useMemo, useRef, useState } from 'react'
import { useNeighborhoods } from '../../../hooks/useNeighborhoods.js'
import { useNearbyPlaces } from '../../../hooks/useNearbyPlaces.js'
import { useRentalListings } from '../../../hooks/useRentalListings.js'
import ZoneMapPanel from '../ZoneMapPanel/ZoneMapPanel.jsx'
import CriteriaTable from '../CriteriaTable/CriteriaTable.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import StatTile from '../../molecules/StatTile/StatTile.jsx'
import InfoTip from '../../molecules/InfoTip/InfoTip.jsx'
import IndicatorCard from '../../molecules/IndicatorCard/IndicatorCard.jsx'
import DisclaimerCard from '../../molecules/DisclaimerCard/DisclaimerCard.jsx'
import Badge from '../../atoms/Badge/Badge.jsx'
import Chip from '../../atoms/Chip/Chip.jsx'
import HourlyBars from '../../atoms/HourlyBars/HourlyBars.jsx'
import ScoreMeter from '../../atoms/ScoreMeter/ScoreMeter.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import { formatCurrency, formatDate, formatNumber } from '../../../utils/formatters.js'
import { READING_ICONS } from '../../../utils/reportReadings.js'
import { googlePlaceUrl } from '../../../utils/placeDisplay.js'
import './ZoneAnalysis.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20
// Locales que se listan en la tarjeta de competencia (los más cercanos)
const COMPETITION_ROWS = 5
// Paradas que se listan en la tarjeta de accesibilidad (todas están en el mapa)
const TRANSIT_ROWS = 6
// Orden de los tipos de transporte en la tabla: los de más capacidad primero
const TRANSIT_ORDER = ['subway', 'train', 'bus']
const transitRank = (category) => {
  const rank = TRANSIT_ORDER.indexOf(category)
  return rank === -1 ? TRANSIT_ORDER.length : rank
}

const PENDING_CAPTION = 'Dato pendiente'

// El censo trae los barrios en mayúsculas ("PALERMO")
const titleCase = (text) =>
  text.toLocaleLowerCase('es-AR').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-AR'))

// Un indicador que falló no tumba el resto: su tarjeta muestra el error y las demás siguen
const INDICATOR_ERROR = 'El resto del análisis no se ve afectado.'

/**
 * Estado de la tarjeta de un indicador. Todos llegan juntos en el reporte: mientras
 * carga o si falla el pedido entero, todas las tarjetas comparten ese estado (el error
 * del pedido y su "Reintentar" se muestran una sola vez, arriba de las tarjetas).
 */
function cardState(report, indicator) {
  if (report.status !== 'ok') return { status: report.status }
  if (indicator?.status === 'ok') return { status: 'ok' }
  if (indicator?.status === 'not_applicable') return { status: 'empty', empty: { title: 'No aplica para tu negocio.' } }
  return { status: 'error', error: INDICATOR_ERROR, onRetry: report.retry }
}

function DetailRows({ rows }) {
  return (
    <dl className="zone-analysis-rows">
      {rows
        .filter(({ value }) => value !== null && value !== undefined)
        .map(({ label, value }) => (
          <div key={label} className="zone-analysis-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  )
}

function competitionTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.isExact
    ? formatNumber(data.total)
    : data.total >= COMPETITION_MAX_RESULTS
      ? `${data.total}+`
      : formatNumber(data.total)
  return { value, caption: `${data.directCount} directos` }
}

function trafficTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  return { value: `${data.score}/${data.scoreMax}`, caption: data.timeSlot }
}

function populationTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  if (!data.inCoverage) return { value: null, caption: 'Fuera de la cobertura del censo' }
  return { value: formatNumber(data.poblacionEstimada), caption: 'habitantes en el radio' }
}

function rentTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) return { value: null, caption: 'Sin locales en alquiler publicados en el radio' }
  const listings = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  return {
    value: formatCurrency(data.medianRentArs, 'ARS', { decimals: 0 }),
    caption: `por mes, mediana de ${listings}`,
  }
}

function accessibilityTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = formatNumber(data.total)
  let caption = 'paradas en el radio'
  if (data.subwayCount > 0) {
    caption = data.subwayCount === 1 ? '1 subte en el radio' : `${data.subwayCount} subtes en el radio`
  } else if (data.trainCount > 0) {
    caption = data.trainCount === 1 ? '1 tren en el radio' : `${data.trainCount} trenes en el radio`
  } else if (data.total === 0) {
    caption = 'sin paradas en el radio'
  }
  return { value, caption }
}

// Orden de la tabla de competencia. "Más fuertes" (el de la API): directas primero, después
// por rating ajustado por reseñas (`strength`); sin datos de Google, al final y por cercanía
const COMPETITION_SORTS = {
  strength: (a, b) => {
    if ((a.type === 'Directa') !== (b.type === 'Directa')) return a.type === 'Directa' ? -1 : 1
    const strengthA = a.strength ?? null
    const strengthB = b.strength ?? null
    if (strengthA !== strengthB) {
      if (strengthA === null) return 1
      if (strengthB === null) return -1
      return strengthB - strengthA
    }
    return a.distanceMeters - b.distanceMeters
  },
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  reviews: (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0),
  distance: (a, b) => a.distanceMeters - b.distanceMeters,
}

// Filtros de la tabla de competencia por tipo
const COMPETITION_FILTERS = [
  { key: 'all', label: 'Todos', test: () => true },
  { key: 'direct', label: 'Directos', test: (place) => place.type === 'Directa' },
  { key: 'indirect', label: 'Indirectos', test: (place) => place.type !== 'Directa' },
]

// Qué trae la tabla: con cocina elegida, sus locales en Google más los que solo están en OSM
function competitionListNote(data, places) {
  const fromOsm = places.filter((place) => place.source === 'osm').length
  const fromGoogle = places.length - fromOsm
  const google = `los ${fromGoogle} más populares según Google (devuelve hasta ${COMPETITION_MAX_RESULTS} por consulta)`
  const intro =
    data.listMode === 'cuisine' && data.cuisineLabel
      ? `Competidores de cocina ${data.cuisineLabel.toLowerCase()}: ${google}`
      : `Locales del rubro en el radio: ${google}`
  const osm = fromOsm > 0 ? ` y ${fromOsm} más que figuran en OpenStreetMap, sin rating de Google` : ''
  return `${intro}${osm}. Primero los más fuertes: rating ajustado por cantidad de reseñas.`
}

// Encabezado que ordena la tabla al tocarlo (otra vez: vuelve al orden "más fuertes")
function SortableHeader({ sortKey, activeSort, onSort, children }) {
  const active = activeSort === sortKey
  // Rating y reseñas ordenan de mayor a menor; la distancia, de menor a mayor
  const direction = sortKey === 'distance' ? 'ascending' : 'descending'
  return (
    <th scope="col" aria-sort={active ? direction : undefined}>
      <button
        type="button"
        className={`zone-analysis-sort${active ? ' zone-analysis-sort--active' : ''}`}
        onClick={() => onSort(active ? 'strength' : sortKey)}
      >
        {children}
        <Icon name={active && direction === 'ascending' ? 'chevron-up' : 'chevron-down'} size={12} />
      </button>
    </th>
  )
}

function CompetitionCard({ report, live }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sort, setSort] = useState('strength')
  const [filter, setFilter] = useState('all')
  const indicator = report.data?.indicators.competition
  const state = cardState(report, indicator)
  const data = indicator?.data

  const places = data?.places
  const filterCounts = useMemo(
    () => Object.fromEntries(COMPETITION_FILTERS.map(({ key, test }) => [key, (places ?? []).filter(test).length])),
    [places],
  )
  const sortedPlaces = useMemo(() => {
    const { test } = COMPETITION_FILTERS.find(({ key }) => key === filter)
    return (places ?? []).filter(test).sort(COMPETITION_SORTS[sort])
  }, [places, sort, filter])

  const card = { icon: 'shield-check', title: 'Competencia', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  if (!data || data.total === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title: 'No encontramos locales del rubro en este radio.',
          text: 'Puede ser una oportunidad o una zona con poco movimiento comercial. Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  const canExpand = sortedPlaces.length > COMPETITION_ROWS
  const visiblePlaces = isExpanded ? sortedPlaces : sortedPlaces.slice(0, COMPETITION_ROWS)
  const total = data.isExact
    ? formatNumber(data.total)
    : data.total >= COMPETITION_MAX_RESULTS
      ? `${data.total}+`
      : formatNumber(data.total)
  // Filtrar solo tiene sentido si la lista mezcla directos e indirectos
  const showFilters = filterCounts.direct > 0 && filterCounts.indirect > 0

  return (
    <IndicatorCard
      {...card}
      value={total}
      caption={[
        `locales del rubro: ${data.directCount} directos y ${data.indirectCount} indirectos.`,
        data.averageRating ? `Rating promedio ${formatNumber(data.averageRating)}.` : null,
      ]
        .filter(Boolean)
        .join(' ')}
      callout={data.callout}
      source={`${data.source}${live ? ' · en vivo' : ''} · ${formatDate(data.queryDate)}`}
    >
      <p className="zone-analysis-table-note">{competitionListNote(data, places)}</p>
      {showFilters && (
        <div className="zone-analysis-filters" role="group" aria-label="Filtrar competidores por tipo">
          {COMPETITION_FILTERS.map(({ key, label }) => (
            <Chip key={key} size="s" selected={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="zone-analysis-filter-count">{filterCounts[key]}</span>
            </Chip>
          ))}
        </div>
      )}
      <div className={`zone-analysis-table-wrap ${isExpanded ? 'zone-analysis-table-wrap--expanded' : ''}`}>
        <table className="zone-analysis-table">
          <caption className="zone-analysis-sr-only">Competidores del rubro en el radio, los más fuertes primero</caption>
          <thead>
            <tr>
              <th scope="col">Local</th>
              <SortableHeader sortKey="rating" activeSort={sort} onSort={setSort}>
                Rating
              </SortableHeader>
              <SortableHeader sortKey="reviews" activeSort={sort} onSort={setSort}>
                Reseñas
              </SortableHeader>
              <SortableHeader sortKey="distance" activeSort={sort} onSort={setSort}>
                Dist.
              </SortableHeader>
              <th scope="col">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {visiblePlaces.map((place) => (
              <tr key={place.id}>
                {/* Nombres largos se cortan: el completo aparece al pasar el mouse.
                    Los locales reales llevan a su ficha de Google Maps (los del ejemplo son ficticios);
                    los que solo están en OSM, a una búsqueda por nombre */}
                <th scope="row" title={place.name}>
                  {place.id.startsWith('sample-') ? (
                    place.name
                  ) : (
                    <a
                      className="zone-analysis-place-link"
                      href={googlePlaceUrl(place.name, place.source === 'osm' ? null : place.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${place.name}, ver en Google Maps (se abre en otra pestaña)`}
                    >
                      {place.name}
                      <Icon name="external-link" size={12} />
                    </a>
                  )}
                </th>
                <td>
                  {place.rating ? (
                    formatNumber(place.rating)
                  ) : (
                    <span title={place.source === 'osm' ? 'Figura en OpenStreetMap, sin datos de Google' : 'Sin calificaciones'}>
                      —
                    </span>
                  )}
                </td>
                <td>{place.userRatingCount ? formatNumber(place.userRatingCount) : '—'}</td>
                <td>{place.distanceText}</td>
                <td>
                  {place.type === 'Directa' ? (
                    <span className="zone-analysis-direct">Directa</span>
                  ) : (
                    place.type
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canExpand && (
        <div className="zone-analysis-expand-action">
          <button
            type="button"
            className="zone-analysis-expand-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Ver menos' : `Ver los ${sortedPlaces.length} locales`}</span>
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
        </div>
      )}
    </IndicatorCard>
  )
}

function TrafficCard({ report }) {
  const indicator = report.data?.indicators.traffic
  const state = cardState(report, indicator)
  const card = {
    icon: 'chart-line',
    title: 'Afluencia típica del rubro',
    titleAside: (
      <InfoTip label="Qué es la afluencia">
        En qué horarios suele haber más clientes en locales de tu rubro, de 0 (nada) a 100 (el pico
        del día). Es un perfil típico del rubro en CABA: no se mide en este punto, así que es igual
        en cualquier lugar de Palermo. Sirve para ver si tu franja coincide con las horas fuertes.
      </InfoTip>
    ),
    ...state,
  }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  return (
    <IndicatorCard
      {...card}
      badge={data.badge}
      value={`${data.score}/${data.scoreMax}`}
      caption={`de actividad típica del rubro en tu franja (${data.timeSlot}).`}
      callout={data.callout}
      source={data.source}
    >
      <ScoreMeter value={data.score} max={data.scoreMax} label={`Actividad en tu franja: ${data.score} de ${data.scoreMax}`} />
      <HourlyBars
        hours={data.hourlyActivity}
        summary={`Actividad estimada por hora. Tu franja (${data.timeSlot}) promedia ${data.score} de ${data.scoreMax}.`}
      />
    </IndicatorCard>
  )
}

function PopulationCard({ report }) {
  const indicator = report.data?.indicators.density
  const state = cardState(report, indicator)
  const card = { icon: 'users', title: 'Población', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  if (!data.inCoverage) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{ title: 'Fuera de la cobertura del censo.', text: data.message }}
      />
    )
  }

  return (
    <IndicatorCard
      {...card}
      badge="Estimado"
      value={formatNumber(data.poblacionEstimada)}
      caption="habitantes estimados en el radio."
      source="Censo nacional · INDEC · por radio censal, ponderado por área"
    >
      <DetailRows
        rows={[
          { label: 'Densidad', value: `${formatNumber(data.densidadHabKm2)} hab/km²` },
          { label: 'Hogares', value: formatNumber(data.hogaresEstimados) },
          { label: 'Hogares con NBI', value: `${formatNumber(data.porcentajeNbi)} %` },
          { label: 'Barrios', value: data.barrios?.map(titleCase).join(', ') || null },
        ]}
      />
    </IndicatorCard>
  )
}

// Avisos que se listan en la tarjeta de alquiler (los más cercanos con dirección exacta)
const RENT_ROWS = 6

/**
 * Lista de avisos con dirección exacta: cada dirección se puede ver en el mapa
 * (`onShowOnMap(id)`) y la fila del aviso marcado en el mapa (`selectedId`) se resalta.
 */
function RentListings({ listings, selectedId, onShowOnMap }) {
  const money = (value) => (value ? formatCurrency(value, 'ARS', { decimals: 0 }) : '—')
  return (
    <>
      <p className="zone-analysis-table-note">Avisos con dirección publicada, del más cercano al más lejano</p>
      <div className="zone-analysis-table-wrap">
        <table className="zone-analysis-table zone-analysis-table--rent">
          <caption className="zone-analysis-sr-only">Avisos de alquiler con dirección publicada</caption>
          <thead>
            <tr>
              <th scope="col">Dirección</th>
              <th scope="col">Alquiler</th>
              <th scope="col">Sup.</th>
              <th scope="col">Dist.</th>
            </tr>
          </thead>
          <tbody>
            {listings.slice(0, RENT_ROWS).map((listing) => (
              <tr
                key={listing.id}
                id={`aviso-${listing.id}`}
                className={selectedId === `rent-${listing.id}` ? 'zone-analysis-row--selected' : undefined}
              >
                <th scope="row">
                  <button
                    type="button"
                    className="zone-analysis-map-link"
                    onClick={() => onShowOnMap(listing.id)}
                    aria-label={`Ver ${listing.address} en el mapa`}
                  >
                    <Icon name="map-pin" size={13} />
                    {listing.address}
                  </button>
                </th>
                <td>{money(listing.priceArs)}</td>
                <td>{listing.surfaceM2 ? `${formatNumber(listing.surfaceM2)} m²` : '—'}</td>
                <td>{listing.distanceText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function RentCard({ report, listings, selectedId, onShowOnMap }) {
  const indicator = report.data?.indicators.rent
  const state = cardState(report, indicator)
  const card = { icon: 'store', title: 'Alquiler comercial', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title: 'No hay locales en alquiler publicados en el radio.',
          text: 'Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  const pricedText = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  const money = (value) => (value ? formatCurrency(value, 'ARS', { decimals: 0 }) : null)
  return (
    <IndicatorCard
      {...card}
      value={money(data.medianRentArs)}
      caption={`por mes, mediana de ${pricedText} en el radio.`}
      source="ZonaProp · avisos de locales comerciales en alquiler"
    >
      <DetailRows
        rows={[
          { label: 'Promedio', value: money(data.averageRentArs) },
          { label: 'Precio por m²', value: money(data.medianPricePerM2Ars) },
          {
            label: 'Superficie promedio',
            value: data.averageSurfaceM2 ? `${formatNumber(data.averageSurfaceM2)} m²` : null,
          },
        ]}
      />
      {listings?.length > 0 && (
        <RentListings listings={listings} selectedId={selectedId} onShowOnMap={onShowOnMap} />
      )}
    </IndicatorCard>
  )
}

function AccessibilityCard({ report, onShowOnMap }) {
  const indicator = report.data?.indicators.accessibility
  const state = cardState(report, indicator)
  const card = { icon: 'bus', title: 'Accesibilidad y transporte', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  if (data.total === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title: 'No encontramos paradas ni estaciones en este radio.',
          text: 'Puede ser una zona residencial interna o con poco transporte registrado. Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  // Agrupado por tipo (subte, tren, colectivo, otros) y por cercanía dentro de cada uno:
  // un subte a 400 m pesa más que el sexto colectivo a 200 m
  const places = [...(data.places || [])]
    .sort(
      (a, b) =>
        transitRank(a.category) - transitRank(b.category) || a.distanceMeters - b.distanceMeters,
    )
    .slice(0, TRANSIT_ROWS)
  const total = formatNumber(data.total)

  const breakdown = []
  if (data.subwayCount > 0) {
    breakdown.push(`${data.subwayCount} ${data.subwayCount === 1 ? 'subte' : 'subtes'}`)
  }
  if (data.trainCount > 0) {
    breakdown.push(`${data.trainCount} ${data.trainCount === 1 ? 'tren' : 'trenes'}`)
  }
  if (data.busCount > 0) {
    breakdown.push(`${data.busCount} ${data.busCount === 1 ? 'parada de colectivo' : 'paradas de colectivo'}`)
  }
  if (data.otherCount > 0) {
    breakdown.push(`${data.otherCount} otros transportes`)
  }

  const caption = [
    breakdown.length > 0
      ? `puntos de transporte en el radio: ${breakdown.join(', ')}.`
      : 'puntos de transporte en el radio.',
    data.busLineCount > 0
      ? `Pasan ${data.busLineCount} ${data.busLineCount === 1 ? 'línea' : 'líneas'} de colectivo.`
      : null,
  ]
    .filter(Boolean)
    .join(' ')
  // Datos de nuestra copia de OSM: la fecha es la de su última actualización
  const updated = data.updatedAt ? ` · datos al ${formatDate(data.updatedAt)}` : ''

  return (
    <IndicatorCard
      {...card}
      value={total}
      caption={caption}
      callout={data.callout}
      source={`Paradas y estaciones de ${data.source}${updated}`}
    >
      <p className="zone-analysis-table-note">
        {places.length < data.total
          ? `Las ${places.length} más importantes y cercanas; las ${formatNumber(data.total)} están en el mapa.`
          : 'Todas están en el mapa.'}{' '}
        Cada parada cuenta una vez aunque tenga una por vereda.
      </p>
      <div className="zone-analysis-table-wrap">
        <table className="zone-analysis-table zone-analysis-table--transit">
          <caption className="zone-analysis-sr-only">Paradas y estaciones en el radio, subte y tren primero</caption>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Parada / Estación</th>
              <th scope="col">Líneas</th>
              <th scope="col">Dist.</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <tr key={place.id}>
                <td>
                  <span className={`zone-analysis-transit-badge zone-analysis-transit-badge--${place.category}`}>
                    {place.type || 'Transporte'}
                  </span>
                </td>
                <th scope="row" title={place.cleanName}>
                  {place.location ? (
                    <button
                      type="button"
                      className="zone-analysis-place-link zone-analysis-place-link--button"
                      onClick={() => onShowOnMap(place.id)}
                      aria-label={`${place.cleanName}, ver en el mapa`}
                    >
                      {place.cleanName}
                      <Icon name="map-pin" size={12} />
                    </button>
                  ) : (
                    place.cleanName
                  )}
                </th>
                <td>{place.lines ?? <span title="OpenStreetMap no tiene sus líneas cargadas">—</span>}</td>
                <td>{place.distanceText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IndicatorCard>
  )
}

// Tarjetas de detalle: id para los saltos desde los datos clave y los criterios, y la
// capa del mapa que acompaña su lectura (null: el mapa se queda con la que tenga)
const SECTIONS = {
  competition: { id: 'zona-competencia', layer: 'places' },
  traffic: { id: 'zona-afluencia', layer: 'places' },
  accessibility: { id: 'zona-accesibilidad', layer: 'transit' },
  population: { id: 'zona-poblacion', layer: null },
  rent: { id: 'zona-alquiler', layer: 'rentals' },
}

// Criterio del cuadro "Fortalezas y debilidades" → tarjeta con su evidencia
const CRITERIA_EVIDENCE = {
  cost: 'rent',
  audience: 'population',
  schedule: 'traffic',
  arrival: 'population',
  competition: 'competition',
  accessibility: 'accessibility',
}

// Conteo de lecturas del veredicto, en el orden en que se muestran
const VERDICT_READINGS = [
  { reading: 'strength', one: 'fortaleza', many: 'fortalezas' },
  { reading: 'alert', one: 'alerta', many: 'alertas' },
  { reading: 'weakness', one: 'debilidad', many: 'debilidades' },
  { reading: 'not_evaluated', one: 'sin datos', many: 'sin datos' },
]

// Preferencia "mapa oculto": por navegador, sin datos del usuario
const MAP_PREFERENCE_KEY = 'profitzone_analysis_map_collapsed_v1'

function readMapCollapsed() {
  try {
    return localStorage.getItem(MAP_PREFERENCE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMapCollapsed(collapsed) {
  try {
    localStorage.setItem(MAP_PREFERENCE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignorar almacenamiento bloqueado: el mapa vuelve a mostrarse la próxima vez
  }
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
// Mismo corte que ZoneMapPanel.css: debajo, el mapa es una franja y se amplía como panel
const isNarrowScreen = () => window.matchMedia?.('(max-width: 1023px)').matches ?? false

// Lleva a una tarjeta de detalle y le pasa el foco (para teclado y lectores de pantalla)
function goToSection(key) {
  const element = document.getElementById(SECTIONS[key].id)
  if (!element) return
  element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  element.focus({ preventScroll: true })
}

function Verdict({ summary, criteria }) {
  const counts = VERDICT_READINGS.map((item) => ({
    ...item,
    count: criteria.filter((criterion) => criterion.reading === item.reading).length,
  })).filter((item) => item.count > 0)

  return (
    <section className="zone-analysis-verdict" aria-labelledby="zone-analysis-verdict-title">
      <h2 id="zone-analysis-verdict-title" className="zone-analysis-verdict-title">
        Resumen
      </h2>
      {summary && <p className="zone-analysis-summary">{summary}</p>}
      {counts.length > 0 && (
        <ul className="zone-analysis-verdict-counts" aria-label="Lectura de los criterios">
          {counts.map((item) => (
            <li key={item.reading}>
              <Badge variant={item.reading} icon={READING_ICONS[item.reading]}>
                {item.count} {item.count === 1 ? item.one : item.many}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Análisis y reporte completo de una zona. Lo usan el paso 4 del flujo (Analisis), el
 * detalle de un reporte guardado (ReporteGuardado) y el reporte de ejemplo (ReporteEjemplo),
 * para que un reporte se vea igual en todos lados.
 * Orden de lectura: primero la conclusión (resumen y conteo de lecturas), los datos clave
 * y las fortalezas y debilidades; después la evidencia (tarjetas de cada dato) y al final
 * las fuentes. El mapa acompaña toda la lectura (ZoneMapPanel) y muestra la capa de la
 * sección que se está leyendo.
 * - `report`: lo que devuelve useAnalysisReport ({ status, data, error, retry }).
 * - `point`, `categoryCode`, `subcategoryCode`: punto y rubro para el mapa mientras carga
 *   el reporte (ej. los del flujo); con el reporte se usan los suyos.
 * - `match`: criterio de competencia directa para los puntos del mapa (sin él, todos
 *   los locales se ven iguales y la referencia de "directa" no se muestra).
 * - `live`: false si los datos no son de una consulta en el momento (ej. el reporte de
 *   ejemplo, que viene guardado): las fuentes no dicen "en vivo".
 */
function ZoneAnalysis({
  report,
  point = null,
  categoryCode = null,
  subcategoryCode = null,
  match = null,
  live = true,
}) {
  const neighborhoods = useNeighborhoods()
  const reportData = report.data
  const analysis = reportData?.analysis
  const location = analysis?.location ?? point
  const neighborhood = neighborhoods.data?.[0] ?? null
  const mainRef = useRef(null)

  const [mapCollapsed, setMapCollapsed] = useState(readMapCollapsed)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [mapLayer, setMapLayer] = useState('places')
  const [selectedId, setSelectedId] = useState(null)

  // Puntos del mapa: negocios del rubro según OpenStreetMap. Los locales de Google Places
  // van solo en la tabla: sus términos no permiten mostrarlos sobre un mapa que no es de Google.
  const nearbyPlaces = useNearbyPlaces({
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius: location?.radius,
    category: analysis?.category.code ?? categoryCode,
    subcategory: analysis?.subcategory.code ?? subcategoryCode,
    match,
  })
  // Avisos de alquiler con dirección exacta (nuestra base): capa "Alquileres" y su lista
  const rentals = useRentalListings({
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius: location?.radius,
  })
  const listings = rentals.data ?? []

  const indicators = reportData?.indicators
  const noPublic = indicators?.competition?.status === 'not_applicable'
  const totalRentals = indicators?.rent?.data?.totalInRadius ?? null
  const transitStops = indicators?.accessibility?.data?.places ?? []

  // El mapa sigue la lectura: cuando una tarjeta con capa propia pasa por la franja de
  // lectura (un poco arriba del centro de la pantalla), el mapa muestra su capa
  const reportReady = report.status === 'ok'
  useEffect(() => {
    if (!reportReady || !mainRef.current) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting && entry.target.dataset.mapLayer)
        if (visible) setMapLayer(visible.target.dataset.mapLayer)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    mainRef.current.querySelectorAll('[data-map-layer]').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [reportReady])

  const changeMapCollapsed = (collapsed) => {
    setMapCollapsed(collapsed)
    writeMapCollapsed(collapsed)
  }

  // Desde la lista de avisos: muestra el aviso en el mapa (en mobile, ampliado)
  const showRentalOnMap = (listingId) => {
    setMapLayer('rentals')
    setSelectedId(`rent-${listingId}`)
    if (mapCollapsed) changeMapCollapsed(false)
    if (isNarrowScreen()) setMapExpanded(true)
  }

  // Desde la tabla de accesibilidad: muestra la parada en el mapa (en mobile, ampliado)
  const showStopOnMap = (stopId) => {
    setMapLayer('transit')
    setSelectedId(stopId)
    if (mapCollapsed) changeMapCollapsed(false)
    if (isNarrowScreen()) setMapExpanded(true)
  }

  // Desde el mapa: marca el punto y, si es un aviso, lleva a su fila en la lista
  // `id` null cierra la ficha. Los negocios de OSM tienen id numérico; los avisos, "rent-…";
  // las paradas, "transit-…"
  const selectOnMap = (id) => {
    setSelectedId(id)
    if (id == null || !String(id).startsWith('rent-') || mapExpanded) return
    document
      .getElementById(`aviso-${id.slice('rent-'.length)}`)
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' })
  }

  const money = (value) => formatCurrency(value, 'ARS', { decimals: 0 })
  const mapLayers = [
    {
      id: 'places',
      label: 'Locales del rubro',
      places: nearbyPlaces.data?.places ?? [],
      legend: match
        ? [
            { label: 'Competencia directa', tone: 'direct' },
            { label: 'Otros locales del rubro', tone: 'place' },
          ]
        : [{ label: 'Locales del rubro', tone: 'place' }],
      note: 'Locales según OpenStreetMap. La tabla de competencia usa Google Places, que no se puede mostrar en este mapa.',
    },
    {
      id: 'transit',
      label: 'Transporte',
      places: transitStops
        .filter((stop) => stop.location)
        .map((stop) => ({
          id: stop.id,
          lat: stop.location.lat,
          lng: stop.location.lng,
          name: stop.lines ? `${stop.cleanName} · ${stop.lines}` : stop.cleanName,
          variant: `transit-${stop.category}`,
          // Datos para la ficha de la parada al tocar el punto
          stop,
        })),
      legend: [
        { label: 'Subte', tone: 'subway' },
        { label: 'Tren', tone: 'train' },
        { label: 'Colectivo', tone: 'bus' },
      ],
      note: 'Paradas y estaciones según OpenStreetMap, con las líneas que paran en cada una.',
    },
    {
      id: 'rentals',
      label: 'Alquileres',
      places: listings.map((listing) => ({
        id: `rent-${listing.id}`,
        lat: listing.lat,
        lng: listing.lng,
        name: listing.priceArs ? `${listing.address} · ${money(listing.priceArs)}` : listing.address,
        variant: 'rent',
        // Datos para la ficha del aviso al tocar el punto
        listing,
      })),
      legend: [{ label: 'Local en alquiler con dirección publicada', tone: 'rent' }],
      note:
        totalRentals === null
          ? 'Solo se ven los avisos con la dirección exacta.'
          : `Se ven ${formatNumber(listings.length)} de ${formatNumber(totalRentals)} avisos del radio: el resto no publica la dirección exacta.`,
    },
  ]

  const placeLabel = location
    ? [analysis?.address, `radio ${location.radius} m`].filter(Boolean).join(' · ')
    : null

  return (
    <div className={`zone-analysis${mapCollapsed ? ' zone-analysis--map-collapsed' : ''}`}>
      <div className="zone-analysis-main" ref={mainRef}>
        {report.status === 'error' && (
          <div className="zone-analysis-error">
            <StatusMessage variant="error">No pudimos analizar la zona: {report.error}</StatusMessage>
            <Button variant="secondary" size="m" onClick={report.retry}>
              Reintentar
            </Button>
          </div>
        )}

        {report.status === 'loading' && (
          <div className="zone-analysis-loading" aria-busy="true" aria-label="Generando el reporte">
            <div className="flow-skeleton" />
            <div className="flow-skeleton zone-analysis-skeleton-tall" />
          </div>
        )}

        {/* 1. La conclusión: resumen, datos clave y fortalezas y debilidades */}
        {reportReady && reportData && (
          <>
            <Verdict summary={reportData.summary} criteria={reportData.criteria} />

            <section className="zone-analysis-kpis" aria-label="Datos clave de la zona">
              <StatTile
                label="Competencia"
                {...competitionTile(indicators?.competition)}
                onClick={noPublic ? undefined : () => goToSection('competition')}
              />
              <StatTile
                label="Afluencia (estimada)"
                {...trafficTile(indicators?.traffic)}
                onClick={noPublic ? undefined : () => goToSection('traffic')}
              />
              <StatTile
                label="Población"
                {...populationTile(indicators?.density)}
                onClick={() => goToSection('population')}
              />
              <StatTile label="Alquiler" {...rentTile(indicators?.rent)} onClick={() => goToSection('rent')} />
              <StatTile
                label="Accesibilidad"
                {...accessibilityTile(indicators?.accessibility)}
                onClick={() => goToSection('accessibility')}
              />
            </section>

            <CriteriaTable
              criteria={reportData.criteria}
              hasEvidence={(code) => {
                const section = CRITERIA_EVIDENCE[code]
                return Boolean(section) && !(noPublic && ['competition', 'traffic'].includes(section))
              }}
              onShowEvidence={(code) => goToSection(CRITERIA_EVIDENCE[code])}
            />
          </>
        )}

        {/* 2. La evidencia: el detalle de cada dato (con carga y error por tarjeta) */}
        {report.status !== 'error' && (
          <section className="zone-analysis-details" aria-labelledby="zone-analysis-details-title">
            <h2 id="zone-analysis-details-title" className="zone-analysis-section-title">
              Los datos de la zona
            </h2>
            <div className="zone-analysis-cards">
              {noPublic ? (
                <p className="zone-analysis-notice">
                  <Icon name="info" size={18} />
                  Como elegiste “Sin atención al público”, no mostramos competencia ni afluencia.
                </p>
              ) : (
                <>
                  <div id={SECTIONS.competition.id} className="zone-analysis-anchor" tabIndex={-1} data-map-layer="places">
                    <CompetitionCard report={report} live={live} />
                  </div>
                  <div id={SECTIONS.traffic.id} className="zone-analysis-anchor" tabIndex={-1} data-map-layer="places">
                    <TrafficCard report={report} />
                  </div>
                </>
              )}
              <div id={SECTIONS.accessibility.id} className="zone-analysis-anchor" tabIndex={-1} data-map-layer="transit">
                <AccessibilityCard report={report} onShowOnMap={showStopOnMap} />
              </div>
              <div id={SECTIONS.population.id} className="zone-analysis-anchor" tabIndex={-1}>
                <PopulationCard report={report} />
              </div>
              <div id={SECTIONS.rent.id} className="zone-analysis-anchor" tabIndex={-1} data-map-layer="rentals">
                <RentCard
                  report={report}
                  listings={listings}
                  selectedId={selectedId}
                  onShowOnMap={showRentalOnMap}
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. Avisos sobre los datos (plegados) y el descargo. Las fuentes ya están al pie
            de cada tarjeta: acá van solo los avisos generales, para no repetirlas */}
        {reportReady && reportData && (
          <>
            {reportData.notices?.length > 0 && (
              <details className="zone-analysis-sources">
                <summary className="zone-analysis-sources-summary">
                  <span>Cómo leer estos datos</span>
                  <Icon name="chevron-down" size={16} />
                </summary>
                <ul className="zone-analysis-notes">
                  {reportData.notices.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </details>
            )}

            <DisclaimerCard />
          </>
        )}
      </div>

      <ZoneMapPanel
        location={location}
        neighborhood={neighborhood}
        loading={neighborhoods.status === 'loading'}
        placeLabel={placeLabel}
        layers={mapLayers}
        layer={mapLayer}
        onLayerChange={setMapLayer}
        selectedId={selectedId}
        onSelect={selectOnMap}
        collapsed={mapCollapsed}
        onCollapsedChange={changeMapCollapsed}
        expanded={mapExpanded}
        onExpandedChange={setMapExpanded}
      />
    </div>
  )
}

export default ZoneAnalysis
