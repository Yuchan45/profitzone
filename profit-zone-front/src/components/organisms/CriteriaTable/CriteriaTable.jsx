import Badge from '../../atoms/Badge/Badge.jsx'
import { READING_LABELS } from '../../../utils/reportReadings.js'
import './CriteriaTable.css'

// Cuadro "Fortalezas y debilidades": cada criterio cruza lo que el usuario
// respondió con el dato de la zona. `criteria` viene del reporte de la API.
function CriteriaTable({ criteria }) {
  return (
    <section className="criteria-table" aria-labelledby="criteria-table-title">
      <div className="criteria-table-header">
        <h2 id="criteria-table-title" className="criteria-table-title">
          Fortalezas y debilidades
        </h2>
        <div className="criteria-table-legend" aria-hidden="true">
          {Object.entries(READING_LABELS).map(([reading, label]) => (
            <Badge key={reading} variant={reading}>
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
              </th>
              <td className="criteria-table-business">{criterion.yourBusiness ?? '—'}</td>
              <td className="criteria-table-zone">
                {criterion.zone}
                {criterion.estimated && <span className="criteria-table-estimated"> · estimado</span>}
              </td>
              <td className="criteria-table-reading">
                <Badge variant={criterion.reading}>{READING_LABELS[criterion.reading]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default CriteriaTable
