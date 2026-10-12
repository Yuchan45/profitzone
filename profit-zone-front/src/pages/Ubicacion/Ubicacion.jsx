import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useNeighborhoods } from '../../hooks/useNeighborhoods.js'
import { useAddressSearch } from '../../hooks/useAddressSearch.js'
import { useReverseGeocode } from '../../hooks/useReverseGeocode.js'
import { useNearbyPlaces } from '../../hooks/useNearbyPlaces.js'
import { useSaveLocation } from '../../hooks/useSaveLocation.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import LocationMap from '../../components/organisms/LocationMap/LocationMap.jsx'
import BusinessSummary from '../../components/organisms/BusinessSummary/BusinessSummary.jsx'
import Modal from '../../components/organisms/Modal/Modal.jsx'
import RegisterForm from '../../components/organisms/RegisterForm/RegisterForm.jsx'
import LoginForm from '../../components/organisms/LoginForm/LoginForm.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import AddressSearch from '../../components/molecules/AddressSearch/AddressSearch.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import RangeSlider from '../../components/atoms/RangeSlider/RangeSlider.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Divider from '../../components/atoms/Divider/Divider.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { formatDistance, isPointInPolygons, walkingMinutes } from '../../utils/geo.js'
import { toAuthFormError } from '../../utils/apiErrors.js'
import { FLOW_STEPS } from '../../utils/flowSteps.js'
import { visibleQuestions } from '../../utils/hiddenQuestions.js'
import './Ubicacion.css'

// Rango del radio en metros. Hasta FREE_MAX es para todos; más allá, solo planes pagos.
// Pendiente: la API todavía valida 200 a 600 m (fase 2 del paso 3).
const RADIUS = { min: 100, max: 2000, step: 50, initial: 300 }
const FREE_MAX_RADIUS = 600
const UNLIMITED_RADIUS_ROLES = ['premium', 'admin']

const percentOfRadius = (meters) => ((meters - RADIUS.min) / (RADIUS.max - RADIUS.min)) * 100

const AUTH_TAB_ITEMS = [
  { label: 'Crear cuenta', value: 'register' },
  { label: 'Iniciar sesión', value: 'login' },
]

// Etiquetas cortas del panel "Tu negocio" para las preguntas generales
const SUMMARY_LABELS = {
  service_mode: 'Atención',
  target_age: 'Público',
  schedule: 'Horario',
  arrival_type: 'Cliente',
  budget: 'Presupuesto',
}

function buildSummaryRows(survey, answers) {
  // Respuestas de preguntas ocultas (ej. con "Sin atención al público") no se muestran
  const visible = visibleQuestions(survey, answers)
  const labelOf = (question) =>
    (answers[question.code] ?? [])
      .map((code) => question.options.find((option) => option.code === code)?.label)
      .filter(Boolean)
      .join(', ')

  const rows = [{ label: 'Rubro', value: `${survey.category.name} · ${survey.subcategory.name}` }]
  for (const question of visible.filter((q) => q.section === 'business')) {
    const value = labelOf(question)
    if (value) rows.push({ label: SUMMARY_LABELS[question.code] ?? question.prompt, value })
  }
  const details = visible.filter((q) => q.section === 'details').map(labelOf).filter(Boolean).join(' · ')
  if (details) rows.push({ label: 'Detalles', value: details })
  return rows
}

/**
 * Criterio de competencia directa para la vista previa: la opción elegida que tiene
 * etiquetas de OSM asociadas (`metadata.osmCuisine`, ej. "Asiática") como "pregunta:opción".
 */
function directMatch(survey, answers) {
  for (const question of visibleQuestions(survey, answers)) {
    for (const code of answers[question.code] ?? []) {
      const option = question.options.find((o) => o.code === code)
      if (option?.metadata?.osmCuisine?.length) return `${question.code}:${option.code}`
    }
  }
  return null
}

function pluralize(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

function Ubicacion() {
  const flow = useAnalysisFlow()
  const { categoryCode, subcategoryCode, answers, location, setLocation } = flow
  const { status: authStatus, user, register, login } = useAuth()
  const navigate = useNavigate()
  const steps = useFlowSteps()
  const neighborhoods = useNeighborhoods()
  const survey = useSubcategorySurvey(categoryCode, subcategoryCode)
  const addressSearch = useAddressSearch()
  const reverseGeocode = useReverseGeocode()
  const saveLocation = useSaveLocation()

  const [query, setQuery] = useState('')
  const [focusKey, setFocusKey] = useState(0)
  const [authModal, setAuthModal] = useState({ open: false, tab: 'register' })
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)
  // Avisos: se intentó pasar el radio del plan / se tocó fuera del barrio
  const [radiusBlocked, setRadiusBlocked] = useState(false)
  const [outsidePick, setOutsidePick] = useState(false)

  const radiusLimit = UNLIMITED_RADIUS_ROLES.includes(user?.role) ? RADIUS.max : FREE_MAX_RADIUS

  // Un radio guardado mayor al del plan (ej. cerró sesión un usuario premium) se recorta.
  // Mientras se recupera la sesión no se sabe el plan: se espera para no recortar de más
  useEffect(() => {
    if (authStatus !== 'loading' && location && location.radius > radiusLimit) {
      setLocation({ ...location, radius: radiusLimit })
    }
  }, [authStatus, location, radiusLimit, setLocation])

  // Vista previa de la competencia: negocios del rubro dentro del círculo (OSM, gratis)
  const nearbyPlaces = useNearbyPlaces({
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius: Math.min(location?.radius ?? RADIUS.initial, radiusLimit),
    category: categoryCode,
    subcategory: subcategoryCode,
    match: survey.status === 'ok' ? directMatch(survey.data, answers) : null,
  })

  // Autocompletado: busca sugerencias de Palermo 300 ms después de dejar de escribir
  const { search: searchSuggestions } = addressSearch
  useEffect(() => {
    if (!suggestionsEnabled || query.trim().length < 3) return
    const timer = setTimeout(() => searchSuggestions(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query, suggestionsEnabled, searchSuggestions])

  // Con el paso 2 sin terminar no se puede elegir la zona. Sin sesión el análisis
  // todavía no existe en la API: se crea recién en "Analizar zona"
  if (!FLOW_STEPS.find((step) => step.id === 'negocio').isComplete(flow)) {
    return <Navigate to="/analizar/negocio" replace />
  }

  const neighborhood = neighborhoods.data?.[0] ?? null
  const radius = Math.min(location?.radius ?? RADIUS.initial, radiusLimit)
  const point = location ? { lat: location.lat, lng: location.lng } : null
  const isOutside = Boolean(point && neighborhood && !isPointInPolygons(point, neighborhood.boundary))
  const isSaving = saveLocation.status === 'saving'

  // Punto elegido en el mapa: el buscador pasa a mostrar la dirección del punto nuevo
  // (o queda vacío si no hay una cerca), para que no quede una dirección que ya no aplica
  const handlePointChange = async (nextPoint) => {
    setOutsidePick(false)
    setLocation({ ...nextPoint, radius })
    setSuggestionsEnabled(false)
    addressSearch.clear()
    setQuery('')
    const label = await reverseGeocode.lookup(nextPoint)
    if (label) setQuery(label)
  }
  const handleRadiusChange = (nextRadius, blocked) => {
    setRadiusBlocked(blocked)
    if (point) setLocation({ ...point, radius: nextRadius })
  }

  const handleQueryChange = (value) => {
    // Si el usuario escribe, la dirección del punto que estaba llegando ya no se pone
    reverseGeocode.cancel()
    setQuery(value)
    setSuggestionsEnabled(true)
    if (value.trim().length < 3) addressSearch.clear()
  }

  const handleSelectAddress = (result) => {
    // Una calle sin altura no tiene punto: se completa el texto para que agregue el número
    if (result.type === 'street') {
      setQuery(`${result.label} `)
      addressSearch.clear()
      // No se vuelve a sugerir la misma calle: se busca de nuevo cuando escriba la altura
      setSuggestionsEnabled(false)
      return
    }
    setSuggestionsEnabled(false)
    reverseGeocode.cancel()
    setLocation({ lat: result.lat, lng: result.lng, radius })
    setQuery(result.label)
    addressSearch.clear()
    setFocusKey((key) => key + 1)
  }

  const analyze = async () => {
    // Solo las preguntas que aplican: las ocultas no se mandan
    const questionCodes = survey.data
      ? visibleQuestions(survey.data, answers).map((q) => q.code)
      : Object.keys(answers)
    const savedId = await saveLocation.save(questionCodes)
    // El paso 4 (Análisis) todavía no tiene vista: se va directo al reporte
    if (savedId) navigate(`/analizar/reporte/${savedId}`)
  }

  // "Analizar zona" pide cuenta: sin sesión se abre el modal y se sigue al entrar
  const handleAnalyze = () => {
    if (authStatus === 'authenticated') {
      analyze()
    } else {
      setAuthModal({ open: true, tab: 'register' })
    }
  }

  const continueAfterAuth = (authenticate) => async (values) => {
    try {
      await authenticate(values)
    } catch (error) {
      throw toAuthFormError(error)
    }
    setAuthModal((prev) => ({ ...prev, open: false }))
    await analyze()
  }

  return (
    <div className="flow-step ubicacion">
      <Stepper steps={steps} current={3} />

      <StepHeading
        title="Elegí dónde mirar"
        subtitle={`Marcá un punto dentro de ${neighborhood?.name ?? 'Palermo'} y ajustá el radio. Analizamos todo lo que cae dentro del círculo.`}
      />

      {neighborhoods.status === 'loading' && <div className="flow-skeleton ubicacion-skeleton" aria-busy="true" aria-label="Cargando el mapa" />}

      {neighborhoods.status === 'error' && (
        <StatusMessage variant="error">No pudimos cargar el mapa: {neighborhoods.error}</StatusMessage>
      )}

      {neighborhoods.status === 'ok' && !neighborhood && (
        <StatusMessage variant="error">
          Todavía no hay barrios disponibles para analizar (falta cargar el censo).
        </StatusMessage>
      )}

      {neighborhood && (
        <div className="ubicacion-layout">
          <LocationMap
            center={neighborhood.center}
            bounds={neighborhood.bounds}
            boundary={neighborhood.boundary}
            point={point}
            radius={radius}
            onPointChange={handlePointChange}
            onOutsidePick={() => setOutsidePick(true)}
            places={nearbyPlaces.data?.places}
            focusKey={focusKey}
            outside={isOutside}
          />

          <aside className="ubicacion-panel">
            <AddressSearch
              value={query}
              onChange={handleQueryChange}
              onSearch={addressSearch.search}
              onSelect={handleSelectAddress}
              status={addressSearch.status}
              results={addressSearch.results}
              error={addressSearch.error}
              areaName={neighborhood.name}
              placeholder={reverseGeocode.status === 'loading' ? 'Buscando dirección…' : undefined}
            />

            <div className="ubicacion-radius">
              <div className="ubicacion-radius-header">
                <label htmlFor="ubicacion-radius-input">Radio de análisis</label>
                <span className="ubicacion-radius-value">
                  {formatDistance(radius)} · ≈ {walkingMinutes(radius)} min a pie
                </span>
              </div>
              <RangeSlider
                id="ubicacion-radius-input"
                min={RADIUS.min}
                max={RADIUS.max}
                step={RADIUS.step}
                value={radius}
                onChange={handleRadiusChange}
                limit={radiusLimit}
                disabled={!point}
              />
              <div className="ubicacion-radius-scale" aria-hidden="true">
                <span>{formatDistance(RADIUS.min)}</span>
                {radiusLimit < RADIUS.max && (
                  <span
                    className="ubicacion-radius-limit"
                    style={{ '--limit-position': `${percentOfRadius(radiusLimit)}%` }}
                  >
                    {formatDistance(radiusLimit)}
                  </span>
                )}
                <span className="ubicacion-radius-max">
                  {radiusLimit < RADIUS.max && <Icon name="lock" size={12} />}
                  {formatDistance(RADIUS.max)}
                </span>
              </div>
              {radiusBlocked && (
                <StatusMessage>
                  Más de {formatDistance(FREE_MAX_RADIUS)} es para el plan premium.
                </StatusMessage>
              )}
            </div>

            {point && !isOutside && (
              <div className="ubicacion-preview" aria-live="polite">
                <p className="ubicacion-preview-title">Competencia en el radio</p>
                {nearbyPlaces.status === 'error' && (
                  <p className="ubicacion-preview-text">No pudimos cargar los negocios cercanos.</p>
                )}
                {nearbyPlaces.status !== 'error' && !nearbyPlaces.data && (
                  <p className="ubicacion-preview-text">Buscando negocios del rubro…</p>
                )}
                {nearbyPlaces.status !== 'error' && nearbyPlaces.data && (
                  <>
                    <p className="ubicacion-preview-text">
                      <span className="ubicacion-preview-dot" aria-hidden="true" />
                      {pluralize(nearbyPlaces.data.total, 'negocio del rubro', 'negocios del rubro')}
                    </p>
                    {nearbyPlaces.data.directLabel && (
                      <p className="ubicacion-preview-text">
                        <span className="ubicacion-preview-dot ubicacion-preview-dot--direct" aria-hidden="true" />
                        {nearbyPlaces.data.directTotal} de cocina {nearbyPlaces.data.directLabel.toLowerCase()}
                      </p>
                    )}
                    <p className="ubicacion-preview-note">
                      Vista previa con datos de OpenStreetMap: puede no estar completa. El análisis usa datos
                      actualizados.
                    </p>
                  </>
                )}
              </div>
            )}

            {(isOutside || outsidePick) && (
              <StatusMessage variant="error">Elegí un punto dentro de {neighborhood.name}.</StatusMessage>
            )}
            {!point && (
              <StatusMessage>Marcá un punto en el mapa o buscá una dirección para empezar.</StatusMessage>
            )}

            <Divider />

            {survey.status === 'ok' && (
              <BusinessSummary rows={buildSummaryRows(survey.data, answers)} editTo="/analizar/negocio" />
            )}

            {saveLocation.status === 'error' && (
              <StatusMessage variant="error">No pudimos guardar la zona: {saveLocation.error}</StatusMessage>
            )}

            <div className="ubicacion-actions">
              <Button
                variant="primary"
                disabled={!point || isOutside || isSaving || authStatus === 'loading'}
                onClick={handleAnalyze}
              >
                {isSaving ? 'Guardando…' : 'Analizar zona'}
              </Button>
              <Button variant="secondary" to="/analizar/negocio">
                Anterior
              </Button>
            </div>
          </aside>
        </div>
      )}

      <Modal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        title="Iniciá tu análisis"
      >
        <p className="ubicacion-auth-intro">
          Para iniciar el análisis necesitás una cuenta. Creala y el análisis queda en Mis reportes, sin
          repetir nada.
        </p>
        <SegmentedNav
          items={AUTH_TAB_ITEMS}
          label="Crear cuenta o iniciar sesión"
          value={authModal.tab}
          onChange={(tab) => setAuthModal((prev) => ({ ...prev, tab }))}
        />
        {authModal.tab === 'register' ? (
          <RegisterForm
            onSubmit={continueAfterAuth(register)}
            onSwitchToLogin={() => setAuthModal((prev) => ({ ...prev, tab: 'login' }))}
          />
        ) : (
          <LoginForm
            onSubmit={continueAfterAuth(login)}
            onSwitchToRegister={() => setAuthModal((prev) => ({ ...prev, tab: 'register' }))}
          />
        )}
      </Modal>
    </div>
  )
}

export default Ubicacion
