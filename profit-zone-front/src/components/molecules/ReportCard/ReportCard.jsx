import { Link } from 'react-router-dom'
import IconTile from '../../atoms/IconTile/IconTile.jsx'
import IconButton from '../../atoms/IconButton/IconButton.jsx'
import Badge from '../../atoms/Badge/Badge.jsx'
import './ReportCard.css'

// Estado del análisis: verde si es un reporte guardado, amarillo si es un borrador
const STATUS_BADGES = {
  saved: { variant: 'strength', label: 'Finalizado' },
  draft: { variant: 'alert', label: 'Borrador' },
}

/**
 * Fila de "Mis reportes". Termina con una flecha (con tooltip `openLabel`) para seguir:
 * abrir el reporte o continuar el borrador.
 * - `title`: texto o nodo (ej. el nombre editable con su lápiz).
 * - `to`: la card abre el reporte. El link es una capa sobre toda la card (nombre
 *   accesible: `linkLabel`); lo que va encima de esa capa, como la flecha, los botones de
 *   `actions` o el lápiz del título, se puede tocar aparte.
 * - `onOpen`: sin `to`, la flecha es un botón (ej. continuar un borrador).
 * - `actions`: botones propios de la fila (ej. Eliminar).
 */
function ReportCard({
  icon,
  title,
  linkLabel,
  openLabel,
  details,
  date,
  status,
  to,
  onOpen,
  openDisabled,
  actions,
}) {
  const badge = STATUS_BADGES[status]

  return (
    <div className={`report-card${to ? ' report-card--link' : ''}`}>
      {to && <Link to={to} className="report-card-link" aria-label={linkLabel} />}
      <IconTile icon={icon} size="m" />
      <span className="report-card-body">
        <span className="report-card-heading">
          <span className="report-card-title">{title}</span>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </span>
        <span className="report-card-details">{details}</span>
      </span>
      <span className="report-card-date">{date}</span>
      {actions && <div className="report-card-actions">{actions}</div>}
      {to ? (
        // El link de la card ya lo anuncia: esta flecha es solo para el mouse (con su tooltip)
        <IconButton
          icon="arrow-right"
          iconSize={18}
          label={openLabel}
          to={to}
          className="report-card-open"
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : (
        onOpen && (
          <IconButton
            icon="arrow-right"
            iconSize={18}
            label={openLabel}
            onClick={onOpen}
            disabled={openDisabled}
            className="report-card-open"
          />
        )
      )}
    </div>
  )
}

export default ReportCard
