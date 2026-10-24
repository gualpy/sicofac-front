export function formatPlanPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}/año`
}

export function formatPlanCount(value: number | null, singular: string, plural: string): string {
  if (value === null) return `${plural} ilimitados`
  return `${value} ${value === 1 ? singular : plural}`
}
