// Simple rent vs buy model.
// Both scenarios start with the same cash. Whoever has the lower yearly
// housing cost invests the difference at the investment return rate.
// Result: net worth of each scenario at the end of every year.

export function monthlyMortgage(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (principal <= 0) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

export function compare(p) {
  const down = p.homePrice * (p.downPct / 100)
  const closing = p.homePrice * (p.closingPct / 100)
  const loan = p.homePrice - down
  const payment = monthlyMortgage(loan, p.ratePct, p.termYears)
  const r = p.ratePct / 100 / 12
  const inv = p.investPct / 100

  let balance = loan
  let homeValue = p.homePrice
  let rent = p.rent
  let renterPortfolio = down + closing // renter invests the cash a buyer spends upfront
  let buyerPortfolio = 0
  const rows = []

  for (let year = 1; year <= p.years; year++) {
    let mortgagePaid = 0
    for (let m = 0; m < 12; m++) {
      if (balance > 0) {
        const interest = balance * r
        const pay = Math.min(payment, balance + interest)
        balance = balance + interest - pay
        mortgagePaid += pay
      }
    }
    const ownCosts =
      homeValue * ((p.taxPct + p.maintPct) / 100) + p.insurance
    const buyCost = mortgagePaid + ownCosts
    const rentCost = rent * 12

    renterPortfolio *= 1 + inv
    buyerPortfolio *= 1 + inv
    if (buyCost > rentCost) renterPortfolio += buyCost - rentCost
    else buyerPortfolio += rentCost - buyCost

    homeValue *= 1 + p.appreciationPct / 100
    const equity = homeValue * (1 - p.sellPct / 100) - balance
    rows.push({
      year,
      buyCost,
      rentCost,
      buyNet: equity + buyerPortfolio,
      rentNet: renterPortfolio,
    })
    rent *= 1 + p.rentIncreasePct / 100
  }
  return { payment, upfront: down + closing, rows }
}
