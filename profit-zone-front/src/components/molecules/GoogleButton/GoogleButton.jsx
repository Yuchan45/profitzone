import { useEffect, useRef, useState } from 'react'
import Button from '../../atoms/Button/Button.jsx'
import GoogleLogo from '../../atoms/GoogleLogo/GoogleLogo.jsx'
import './GoogleButton.css'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// El SDK de Google se carga una sola vez por pestaña
let sdkPromise = null
function loadGoogleSdk() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.onload = () => resolve(window.google)
      script.onerror = () => {
        sdkPromise = null
        reject(new Error('No pudimos cargar el ingreso con Google.'))
      }
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

/**
 * "Continuar con Google". Muestra el botón oficial de Google cuando el ingreso está configurado
 * en la API (GOOGLE_CLIENT_ID); si no, un botón deshabilitado.
 * - `clientId`: el Client ID de Google (hooks/useGoogleClientId.js); `undefined` mientras se
 *   carga y `null` si el ingreso con Google no está configurado.
 * - `onCredential(idToken)`: promesa; si falla, su `message` va a `onError`.
 * - `onError(message)`: errores de carga o de ingreso.
 */
function GoogleButton({ clientId, onCredential, onError }) {
  const slotRef = useRef(null)
  const handlers = useRef({ onCredential, onError })
  const [state, setState] = useState('loading') // loading | ready | unavailable

  useEffect(() => {
    handlers.current = { onCredential, onError }
  })

  useEffect(() => {
    if (clientId === undefined) return undefined
    let cancelled = false

    Promise.resolve(clientId)
      .then(async (id) => {
        if (!id) throw new Error('not-configured')
        const google = await loadGoogleSdk()
        if (cancelled || !slotRef.current) return
        google.accounts.id.initialize({
          client_id: id,
          callback: async ({ credential }) => {
            try {
              await handlers.current.onCredential?.(credential)
            } catch (error) {
              handlers.current.onError?.(error.message)
            }
          },
        })
        google.accounts.id.renderButton(slotRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'es',
          logo_alignment: 'center',
          // Google exige un ancho en píxeles (entre 200 y 400). Se mide el padre: el slot está oculto hasta que el botón carga
          width: Math.min(400, Math.max(200, Math.round(slotRef.current.parentElement.clientWidth))),
        })
        setState('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setState('unavailable')
        if (error.message !== 'not-configured') handlers.current.onError?.(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [clientId])

  return (
    <>
      <div ref={slotRef} className="google-button-slot" hidden={state !== 'ready'} />
      {state !== 'ready' && (
        <Button
          variant="secondary"
          className="auth-form-google"
          disabled
          title={state === 'loading' ? 'Cargando…' : 'Ingreso con Google no disponible'}
        >
          <GoogleLogo />
          Continuar con Google
        </Button>
      )}
    </>
  )
}

export default GoogleButton
