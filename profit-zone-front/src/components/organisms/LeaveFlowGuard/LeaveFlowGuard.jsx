import { useLeaveFlowGuard } from '../../../hooks/useLeaveFlowGuard.js'
import Modal from '../Modal/Modal.jsx'
import Button from '../../atoms/Button/Button.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import './LeaveFlowGuard.css'

/**
 * Aviso al salir del flujo de análisis con cambios sin guardar (ver useLeaveFlowGuard).
 * Si se puede guardar (sesión y "Tu negocio" completo): guardar los cambios, salir sin
 * guardarlos o quedarse. Si no (sin sesión o antes de terminar "Tu negocio"): se pierde el progreso.
 */
function LeaveFlowGuard() {
  const guard = useLeaveFlowGuard()

  return (
    <Modal
      open={guard.open}
      onClose={guard.cancel}
      title={guard.canSave ? '¿Guardar los cambios?' : '¿Salir del análisis?'}
    >
      <p className="leave-flow-text">
        {guard.canSave
          ? 'Todavía no analizaste la zona con estos datos. Si guardás los cambios, vas a poder retomar el análisis desde Mis reportes.'
          : 'Todavía no terminaste el análisis. Si salís ahora, se va a perder el progreso.'}
      </p>

      {guard.error && <StatusMessage variant="error">{guard.error}</StatusMessage>}

      <div className="leave-flow-actions">
        <Button variant="text" size="m" onClick={guard.cancel} disabled={guard.saving}>
          Cancelar
        </Button>
        {guard.canSave ? (
          <>
            <Button variant="secondary" size="m" onClick={guard.leave} disabled={guard.saving}>
              Salir sin guardar
            </Button>
            <Button variant="primary" size="m" onClick={guard.save} disabled={guard.saving}>
              {guard.saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        ) : (
          <Button variant="danger" size="m" onClick={guard.leave}>
            Salir
          </Button>
        )}
      </div>
    </Modal>
  )
}

export default LeaveFlowGuard
