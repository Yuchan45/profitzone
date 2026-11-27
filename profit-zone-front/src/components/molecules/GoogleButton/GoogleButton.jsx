import { useEffect, useRef, useState } from 'react'
import Button from '../../atoms/Button/Button.jsx'
import GoogleLogo from '../../atoms/GoogleLogo/GoogleLogo.jsx'
import { fetchGoogleClientId } from '../../../services/auth.service.js'
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

// El Client ID no cambia: se pide una vez
let clientIdPromise = null

/**
 * "Continuar con Google". Muestra el botón oficial de Google cuando el ingreso está configurado
 * en la API (GOOGLE_CLIENT_ID); si no, un botón deshabilitado. No hace falta tener un build
 * distinto: el Client ID viene de la API.
 * - `onCredential(idToken)`: promesa; si falla, su `message` va a `onError`.
 * - `onError(message)`: errores de carga o de ingreso.
 */
function GoogleButton({ onCredential, onError }) {
  const slotRef = useRef(null)
  const handlers = useRef({ onCredential, onError })
  const [state, setState] = useState('loading') // loading | ready | unavailable

  useEffect(() => {
    handlers.current = { onCredential, onError }
  })

  useEffect(() => {
    let cancelled = false

    clientIdPromise ??= fetchGoogleClientId().catch((error) => {
      clientIdPromise = null
      throw error
    })

    clientIdPromise
      .then(async (clientId) => {
        if (!clientId) throw new Error('not-configured')
        const google = await loadGoogleSdk()
        if (cancelled || !slotRef.current) return
        google.accounts.id.initialize({
          client_id: clientId,
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
  }, [])

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
