export const money = (n) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

// Short Indian format for axes: ₹45 L, ₹1.2 Cr
export function moneyShort(n) {
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1e7) return `${sign}₹${+(a / 1e7).toFixed(2)} Cr`
  if (a >= 1e5) return `${sign}₹${+(a / 1e5).toFixed(1)} L`
  if (a >= 1e3) return `${sign}₹${+(a / 1e3).toFixed(0)}K`
  return `${sign}₹${Math.round(a)}`
}
