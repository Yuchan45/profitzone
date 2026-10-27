import Badge from '../../atoms/Badge/Badge.jsx'
import { READING_ICONS, READING_LABELS } from '../../../utils/reportReadings.js'
import './CriteriaTable.css'

// Cuadro "Fortalezas y debilidades": cada criterio cruza lo que el usuario
// respondió con el dato de la zona. `criteria` viene del reporte de la API.
// `onShowEvidence(code)` (opcional): agrega "Ver datos" en los criterios con evidencia
// (`hasEvidence(code)`), para saltar a la tarjeta con el detalle del dato.
function CriteriaTable({ criteria, hasEvidence, onShowEvidence }) {
  return (
    <section className="criteria-table" aria-labelledby="criteria-table-title">
      <div className="criteria-table-header">
        <h2 id="criteria-table-title" className="criteria-table-title">
          Fortalezas y debilidades
        </h2>
        <div className="criteria-table-legend" aria-hidden="true">
          {Object.entries(READING_LABELS).map(([reading, label]) => (
            <Badge key={reading} variant={reading} icon={READING_ICONS[reading]}>
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <table className="criteria-table-grid">
        <thead>
          <tr>
            <th scope="col">Criterio</th>
            <th scope="col">Tu negocio</th>
            <th scope="col">La zona</th>
            <th scope="col" className="criteria-table-reading">
              Lectura
            </th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.code}>
              <th scope="row" className="criteria-table-label">
                {criterion.label}
                {onShowEvidence && hasEvidence?.(criterion.code) && (
                  <button
                    type="button"
                    className="criteria-table-evidence"
                    onClick={() => onShowEvidence(criterion.code)}
                    aria-label={`Ver los datos de ${criterion.label.toLowerCase()}`}
                  >
                    Ver datos
                  </button>
                )}
              </th>
              <td className="criteria-table-business">{criterion.yourBusiness ?? '—'}</td>
              <td className="criteria-table-zone">
                {criterion.zone}
                {criterion.estimated && <span className="criteria-table-estimated"> · estimado</span>}
              </td>
              <td className="criteria-table-reading">
                <Badge variant={criterion.reading} icon={READING_ICONS[criterion.reading]}>
                  {READING_LABELS[criterion.reading]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default CriteriaTable
