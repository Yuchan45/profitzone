// Iniciales para el avatar: "Carlos Mendoza" → "CM".
export function getInitials(user) {
  const first = user?.firstName?.trim()?.[0] ?? ''
  const last = user?.lastName?.trim()?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || '?'
}
