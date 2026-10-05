import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile.js'
import './Perfil.css'

function getInitials(firstName, lastName) {
  const f = firstName ? firstName.trim()[0] : 'C'
  const l = lastName ? lastName.trim()[0] : 'M'
  return `${f}${l}`.toUpperCase()
}

function Perfil() {
  const {
    status,
    profile,
    error,
    isUpdating,
    savePersonalData,
    changePassword,
    toggleGoogle,
    setAvatar,
    removeAvatar,
    deleteProfile,
  } = useProfile()

  // Modificaciones locales sobre los datos personales
  const [personalForm, setPersonalForm] = useState({})

  const currentFirstName = personalForm.firstName ?? profile?.firstName ?? ''
  const currentLastName = personalForm.lastName ?? profile?.lastName ?? ''
  const currentEmail = personalForm.email ?? profile?.email ?? ''

  // Estado del formulario de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)

  // Feedback y mensajes toast
  const [toast, setToast] = useState(null)

  // Referencia para selector de archivo
  const fileInputRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
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
      showToast(err.message || 'Error al guardar los cambios', 'error')
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
      showToast(err.message || 'Error al actualizar la contraseña', 'error')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setAvatar(previewUrl)
      showToast('Foto de perfil actualizada')
    }
  }

  const handleRemovePhoto = async () => {
    try {
      await removeAvatar()
      showToast('Foto de perfil eliminada')
    } catch (err) {
      showToast(err.message || 'Error al quitar la foto', 'error')
    }
  }

  const handleToggleGoogle = async () => {
    try {
      const updated = await toggleGoogle()
      showToast(
        updated.googleLinked
          ? 'Cuenta de Google vinculada con éxito'
          : 'Cuenta de Google desvinculada',
      )
    } catch (err) {
      showToast(err.message || 'Error al vincular cuenta de Google', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseás eliminar tu cuenta? Esta acción no se puede deshacer.',
    )
    if (confirmDelete) {
      try {
        await deleteProfile()
        showToast('Tu cuenta ha sido eliminada')
      } catch (err) {
        showToast(err.message || 'Error al eliminar la cuenta', 'error')
      }
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
        <div className="profile-card">
          <p style={{ color: 'var(--color-error)' }}>
            Ocurrió un error al cargar el perfil: {error}
          </p>
        </div>
      </div>
    )
  }

  const initials = getInitials(currentFirstName, currentLastName)
  const fullName = `${currentFirstName} ${currentLastName}`.trim() || 'Usuario'

  return (
    <div className="profile-page-wrapper">
      {/* Toast de feedback */}
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

      {/* Título de la página */}
      <h1 className="profile-page-title">Perfil</h1>

      {/* Tarjeta superior: Resumen de usuario y foto */}
      <section className="profile-card profile-header-card">
        <div className="profile-header-user">
          <div className="profile-avatar-container">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={fullName}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-fallback">{initials}</div>
            )}
            <button
              type="button"
              className="profile-avatar-badge"
              title="Cambiar foto de perfil"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>

          <div className="profile-header-info">
            <h2 className="profile-user-name">{fullName}</h2>
            <p className="profile-user-meta">
              <span>{profile?.email ?? 'carlos@correo.com'}</span>
              <span className="profile-user-meta-dot">·</span>
              <span>Miembro desde {profile?.memberSince ?? 'septiembre 2026'}</span>
            </p>
          </div>
        </div>

        <div className="profile-header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="profile-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Cambiar foto
          </button>
          <button
            type="button"
            className="profile-btn-secondary"
            onClick={handleRemovePhoto}
          >
            Quitar
          </button>
        </div>
      </section>

      {/* Grilla principal en 2 columnas */}
      <div className="profile-grid-layout">
        {/* Columna izquierda: Datos personales y Seguridad */}
        <div className="profile-col">
          {/* Card: Datos personales */}
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

          {/* Card: Seguridad */}
          <section className="profile-card">
            <h2 className="profile-card__title">Seguridad</h2>
            <p className="profile-card__subtitle">
              Cambiá tu contraseña. Si ingresás con Google, la gestionás desde tu
              cuenta de Google.
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
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
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.43 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.59H1.26a11.96 11.96 0 0 0 0 10.82l4.02-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                    />
                  </svg>
                </div>
                <span className="profile-google-name">Cuenta de Google</span>
              </div>
              <button
                type="button"
                className="profile-google-action"
                onClick={handleToggleGoogle}
              >
                {profile?.googleLinked
                  ? 'Vinculada - Desvincular'
                  : 'No vinculada - Vincular'}
              </button>
            </div>
          </section>
        </div>

        {/* Columna derecha: Tu actividad y Eliminar cuenta */}
        <div className="profile-col">
          {/* Card: Tu actividad */}
          <section className="profile-card">
            <h2 className="profile-card__title">Tu actividad</h2>
            <div className="profile-activity-list">
              <div className="profile-activity-row">
                <span className="profile-activity-label">Reportes guardados</span>
                <strong className="profile-activity-value">
                  {profile?.savedReportsCount ?? 5}
                </strong>
              </div>
              <div className="profile-activity-row">
                <span className="profile-activity-label">Último análisis</span>
                <strong className="profile-activity-value">
                  {profile?.lastAnalysisDate ?? '27/09/2026'}
                </strong>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="profile-btn-secondary profile-btn-block"
            >
              Ir a Mis reportes
            </Link>
          </section>

          {/* Card: Eliminar cuenta */}
          <section className="profile-card">
            <h2 className="profile-card__title">Eliminar cuenta</h2>
            <p className="profile-card__subtitle">
              Se borran tu cuenta y todos tus reportes guardados. No se puede deshacer.
            </p>

            <button
              type="button"
              className="profile-btn-danger profile-btn-block"
              onClick={handleDeleteAccount}
              disabled={isUpdating}
            >
              Eliminar cuenta
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Perfil
