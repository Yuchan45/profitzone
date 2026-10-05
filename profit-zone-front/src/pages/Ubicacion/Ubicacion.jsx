import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useNeighborhoods } from '../../hooks/useNeighborhoods.js'
import { useAddressSearch } from '../../hooks/useAddressSearch.js'
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
import { isPointInPolygons, walkingMinutes } from '../../utils/geo.js'
import { toAuthFormError } from '../../utils/apiErrors.js'
import './Ubicacion.css'

// Rango del radio en metros (la API valida lo mismo, PZ-16)
const RADIUS = { min: 200, max: 600, step: 50, initial: 300 }

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
  const labelOf = (question) =>
    (answers[question.code] ?? [])
      .map((code) => question.options.find((option) => option.code === code)?.label)
      .filter(Boolean)
      .join(', ')

  const rows = [{ label: 'Rubro', value: `${survey.category.name} · ${survey.subcategory.name}` }]
  for (const question of survey.business) {
    const value = labelOf(question)
    if (value) rows.push({ label: SUMMARY_LABELS[question.code] ?? question.prompt, value })
  }
  const details = survey.details.map(labelOf).filter(Boolean).join(' · ')
  if (details) rows.push({ label: 'Detalles', value: details })
  return rows
}

function Ubicacion() {
  const { analysisId, categoryCode, subcategoryCode, answers, location, setLocation } =
    useAnalysisFlow()
  const { status: authStatus, register, login } = useAuth()
  const navigate = useNavigate()
  const steps = useFlowSteps()
  const neighborhoods = useNeighborhoods()
  const survey = useSubcategorySurvey(categoryCode, subcategoryCode)
  const addressSearch = useAddressSearch()
  const saveLocation = useSaveLocation()

  const [query, setQuery] = useState('')
  const [focusKey, setFocusKey] = useState(0)
  const [authModal, setAuthModal] = useState({ open: false, tab: 'register' })

  // Sin análisis guardado (paso 2 sin terminar) no se puede elegir la zona
  if (!analysisId) {
    return <Navigate to="/analizar/negocio" replace />
  }

  const neighborhood = neighborhoods.data?.[0] ?? null
  const radius = location?.radius ?? RADIUS.initial
  const point = location ? { lat: location.lat, lng: location.lng } : null
  const isOutside = Boolean(point && neighborhood && !isPointInPolygons(point, neighborhood.boundary))
  const isSaving = saveLocation.status === 'saving'

  const handlePointChange = (nextPoint) => setLocation({ ...nextPoint, radius })
  const handleRadiusChange = (nextRadius) => point && setLocation({ ...point, radius: nextRadius })

  const handleSelectAddress = (result) => {
    setLocation({ lat: result.lat, lng: result.lng, radius })
    setQuery(result.label)
    addressSearch.clear()
    setFocusKey((key) => key + 1)
  }

  const analyze = async () => {
    const questionCodes = survey.data
      ? [...survey.data.business, ...survey.data.details].map((q) => q.code)
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
            boundary={neighborhood.boundary}
            point={point}
            radius={radius}
            onPointChange={handlePointChange}
            focusKey={focusKey}
            outside={isOutside}
          />

          <aside className="ubicacion-panel">
            <AddressSearch
              value={query}
              onChange={setQuery}
              onSearch={addressSearch.search}
              onSelect={handleSelectAddress}
              status={addressSearch.status}
              results={addressSearch.results}
              error={addressSearch.error}
            />

            <div className="ubicacion-radius">
              <div className="ubicacion-radius-header">
                <label htmlFor="ubicacion-radius-input">Radio de análisis</label>
                <span className="ubicacion-radius-value">
                  {radius} m · ≈ {walkingMinutes(radius)} min a pie
                </span>
              </div>
              <RangeSlider
                id="ubicacion-radius-input"
                min={RADIUS.min}
                max={RADIUS.max}
                step={RADIUS.step}
                value={radius}
                onChange={handleRadiusChange}
                disabled={!point}
              />
              <div className="ubicacion-radius-scale" aria-hidden="true">
                <span>{RADIUS.min} m</span>
                <span>{RADIUS.max} m</span>
              </div>
            </div>

            {isOutside && (
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
