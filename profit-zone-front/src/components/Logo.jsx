import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <MapPin className="size-5" strokeWidth={2.25} />
      </span>
      <span className="font-heading text-lg font-bold text-foreground">ProfitZone</span>
    </Link>
  )
}

export default Logo