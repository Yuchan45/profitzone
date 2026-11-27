import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile.js'
import { useAuth } from '../../hooks/useAuth.js'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import GoogleLogo from '../../components/atoms/GoogleLogo/GoogleLogo.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Modal from '../../components/organisms/Modal/Modal.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import { getApiErrorMessage } from '../../utils/apiErrors.js'
import { formatDate } from '../../utils/formatters.js'
import './Perfil.css'

const MEMBER_SINCE_FORMAT = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

function Perfil() {
  const { user: authUser } = useAuth()
  const {
    status,
    profile,
    error,
    isUpdating,
    savePersonalData,
    changePassword,
    deleteProfile,
  } = useProfile(authUser?.id)

  const [personalForm, setPersonalForm] = useState({})
  const currentFirstName = personalForm.firstName ?? profile?.firstName ?? authUser?.firstName ?? ''
  const currentLastName = personalForm.lastName ?? profile?.lastName ?? authUser?.lastName ?? ''
  const currentEmail = personalForm.email ?? profile?.email ?? authUser?.email ?? ''
  const createdAt = profile?.createdAt ?? authUser?.createdAt
  const memberSince = createdAt ? MEMBER_SINCE_FORMAT.format(new Date(createdAt)) : null

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3500)
  }

  const handlePersonalChange = (e) => {
    const { name, value } = e.target
    setPersonalForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSavePersonal = async (e) => {
    e.preventDefault()
    try {
      await savePersonalData({
        firstName: currentFirstName.trim(),
        lastName: currentLastName.trim(),
        email: currentEmail.trim(),
      })
      setPersonalForm({})
      showToast('Cambios guardados con éxito')
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error')
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword) {
      showToast('Ingresá tu contraseña actual', 'error')
      return
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error')
      return
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setPasswordData({ currentPassword: '', newPassword: '' })
      showToast('Contraseña actualizada con éxito')
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error')
    }
  }

  const confirmDeleteAccount = async () => {
    setDeleteError(null)
    try {
      await deleteProfile()
    } catch (err) {
      setDeleteError(getApiErrorMessage(err))
    }
  }

  if (status === 'loading') {
    return (
      <div className="profile-page-wrapper">
        <h1 className="profile-page-title">Perfil</h1>
        <div className="profile-loading-state">Cargando perfil...</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="profile-page-wrapper">
        <h1 className="profile-page-title">Perfil</h1>
        <StatusMessage variant="error">Ocurrió un error al cargar el perfil: {error}</StatusMessage>
      </div>
    )
  }

  const fullName = `${currentFirstName} ${currentLastName}`.trim() || 'Usuario'

  return (
    <div className="profile-page-wrapper">
      {toast && (
        <div
          className={`profile-toast profile-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'success' ? '✓ ' : '✕ '}
          {toast.message}
        </div>
      )}

      <h1 className="profile-page-title">Perfil</h1>

      <section className="profile-card profile-header-card">
        <div className="profile-header-user">
          <div className="profile-avatar-container">
            <div className="profile-avatar-fallback" role="img" aria-label={fullName}>
              <Icon name="user-round" size={36} strokeWidth={1.75} />
            </div>
          </div>

          <div className="profile-header-info">
            <h2 className="profile-user-name">{fullName}</h2>
            <p className="profile-user-meta">
              <span>{profile?.email ?? authUser?.email}</span>
              {memberSince && (
                <>
                  <span className="profile-user-meta-dot">·</span>
                  <span>Miembro desde {memberSince}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="profile-grid-layout">
        <div className="profile-col">
          <section className="profile-card">
            <h2 className="profile-card__title">Datos personales</h2>
            <form onSubmit={handleSavePersonal}>
              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label htmlFor="inputNombre" className="profile-form-label">
                    Nombre
                  </label>
                  <input
                    id="inputNombre"
                    type="text"
                    name="firstName"
                    className="profile-input"
                    value={currentFirstName}
                    onChange={handlePersonalChange}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="inputApellido" className="profile-form-label">
                    Apellido
                  </label>
                  <input
                    id="inputApellido"
                    type="text"
                    name="lastName"
                    className="profile-input"
                    value={currentLastName}
                    onChange={handlePersonalChange}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="inputEmail" className="profile-form-label">
                  Correo electrónico
                </label>
                <input
                  id="inputEmail"
                  type="email"
                  name="email"
                  className="profile-input"
                  value={currentEmail}
                  onChange={handlePersonalChange}
                  maxLength={320}
                  required
                />
              </div>

              <button
                type="submit"
                className="profile-btn-primary"
                disabled={isUpdating}
              >
                Guardar cambios
              </button>
            </form>
          </section>

          <section className="profile-card">
            <h2 className="profile-card__title">Seguridad</h2>
            <p className="profile-card__subtitle">
              Cambiá tu contraseña. Al guardarla, cerramos tus sesiones activas en otros dispositivos.
            </p>

            <form onSubmit={handleUpdatePassword}>
              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label htmlFor="inputCurrentPass" className="profile-form-label">
                    Contraseña actual
                  </label>
                  <div className="profile-input-wrapper">
                    <input
                      id="inputCurrentPass"
                      type={showCurrentPass ? 'text' : 'password'}
                      name="currentPassword"
                      className="profile-input profile-input--with-toggle"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="profile-toggle-password"
                      onClick={() => setShowCurrentPass((prev) => !prev)}
                      aria-label={
                        showCurrentPass
                          ? 'Ocultar contraseña actual'
                          : 'Mostrar contraseña actual'
                      }
                    >
                      <Icon name={showCurrentPass ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="inputNewPass" className="profile-form-label">
                    Nueva contraseña
                  </label>
                  <div className="profile-input-wrapper">
                    <input
                      id="inputNewPass"
                      type={showNewPass ? 'text' : 'password'}
                      name="newPassword"
                      className="profile-input profile-input--with-toggle"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="profile-toggle-password"
                      onClick={() => setShowNewPass((prev) => !prev)}
                      aria-label={
                        showNewPass
                          ? 'Ocultar nueva contraseña'
                          : 'Mostrar nueva contraseña'
                      }
                    >
                      <Icon name={showNewPass ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="profile-btn-secondary"
                disabled={isUpdating}
              >
                Actualizar contraseña
              </button>
            </form>

            <div className="profile-google-box">
              <div className="profile-google-info">
                <div className="profile-google-icon-wrap" aria-hidden="true">
                  <GoogleLogo size={15} />
                </div>
                <span className="profile-google-name">Cuenta de Google</span>
              </div>
              <button
                type="button"
                className="profile-google-action"
                disabled
                title="El acceso con Google estará disponible próximamente"
              >
                Próximamente
              </button>
            </div>
          </section>
        </div>

        <div className="profile-col">
          <section className="profile-card">
            <h2 className="profile-card__title">Tu actividad</h2>
            <div className="profile-activity-list">
              <div className="profile-activity-row">
                <span className="profile-activity-label">Reportes guardados</span>
                <strong className="profile-activity-value">
                  {profile?.savedReportsCount ?? 0}
                </strong>
              </div>
              <div className="profile-activity-row">
                <span className="profile-activity-label">Último análisis</span>
                <strong className="profile-activity-value">
                  {profile?.lastAnalysisDate ? formatDate(profile.lastAnalysisDate) : 'Sin análisis todavía'}
                </strong>
              </div>
            </div>

            <Link
              to="/mis-reportes"
              className="profile-btn-secondary profile-btn-block"
            >
              Ir a Mis reportes
            </Link>
          </section>

          <section className="profile-card">
            <h2 className="profile-card__title">Eliminar cuenta</h2>
            <p className="profile-card__subtitle">
              Se borran tu cuenta y todos tus reportes guardados. No se puede deshacer.
            </p>

            <button
              type="button"
              className="profile-btn-danger profile-btn-block"
              onClick={() => {
                setDeleteError(null)
                setDeleteOpen(true)
              }}
              disabled={isUpdating}
            >
              Eliminar cuenta
            </button>
          </section>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="¿Eliminar tu cuenta?"
      >
        <p className="profile-modal-text">
          Se van a borrar tu cuenta, tus borradores y todos tus reportes guardados. Esta acción no se puede deshacer.
        </p>
        {deleteError && <StatusMessage variant="error">{deleteError}</StatusMessage>}
        <div className="profile-modal-actions">
          <Button variant="text" size="m" onClick={() => setDeleteOpen(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button variant="danger" size="m" onClick={confirmDeleteAccount} disabled={isUpdating}>
            {isUpdating ? 'Eliminando…' : 'Eliminar cuenta'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Perfil
