import { Link } from 'react-router-dom'
import IconTile from '../../atoms/IconTile/IconTile.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './ReportCard.css'

// Fila de "Mis reportes": toda la card es el link al reporte
function ReportCard({ icon, title, details, date, to }) {
  return (
    <Link to={to} className="report-card">
      <IconTile icon={icon} size="m" />
      <span className="report-card-body">
        <span className="report-card-title">{title}</span>
        <span className="report-card-details">{details}</span>
      </span>
      <span className="report-card-date">{date}</span>
      <Icon name="arrow-right" size={18} className="report-card-arrow" />
    </Link>
  )
}

export default ReportCard
