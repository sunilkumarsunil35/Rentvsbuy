// Month-by-month rent vs buy simulation.
//
// Both scenarios start with the same cash. The buyer spends it on the down
// payment + stamp duty; the renter invests it instead. Every month we compare
// the two outflows:
//   buyer  = EMI + property tax + maintenance + insurance
//   renter = rent
// Whoever pays less that month invests the difference, and both portfolios
// compound monthly at the investment return rate.

export function monthlyEmi(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (principal <= 0) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

// Convert an annual growth rate to the equivalent monthly rate
const monthlyRate = (annualPct) => Math.pow(1 + annualPct / 100, 1 / 12) - 1

export function simulate(p) {
  const down = p.homePrice * (p.downPct / 100)
  const stampDuty = p.homePrice * (p.closingPct / 100)
  const loan = p.homePrice - down
  const emi = monthlyEmi(loan, p.ratePct, p.termYears)
  const loanRate = p.ratePct / 100 / 12
  const investRate = monthlyRate(p.investPct)
  const homeRate = monthlyRate(p.appreciationPct)

  let balance = loan
  let homeValue = p.homePrice
  let rent = p.rent
  let renterPortfolio = down + stampDuty
  let buyerPortfolio = 0

  const rows = [] // one per year
  let year = null

  for (let month = 1; month <= p.years * 12; month++) {
    if (month % 12 === 1) {
      if (month > 1) rent *= 1 + p.rentIncreasePct / 100
      year = { buyOut: 0, rentOut: 0, buyerInvested: 0, renterInvested: 0, emiPaid: 0 }
    }

    // Buyer's outflow this month
    let emiPaid = 0
    if (balance > 0.005) {
      const interest = balance * loanRate
      emiPaid = Math.min(emi, balance + interest)
      balance = balance + interest - emiPaid
    }
    const ownCosts = (homeValue * (p.taxPct + p.maintPct)) / 100 / 12 + p.insurance / 12
    const buyOut = emiPaid + ownCosts
    const rentOut = rent

    // Grow existing investments, then invest this month's difference
    renterPortfolio *= 1 + investRate
    buyerPortfolio *= 1 + investRate
    const diff = buyOut - rentOut
    if (diff > 0) {
      renterPortfolio += diff
      year.renterInvested += diff
    } else {
      buyerPortfolio += -diff
      year.buyerInvested += -diff
    }
    homeValue *= 1 + homeRate

    year.buyOut += buyOut
    year.rentOut += rentOut
    year.emiPaid += emiPaid

    if (month % 12 === 0) {
      const equity = homeValue * (1 - p.sellPct / 100) - balance
      rows.push({
        year: month / 12,
        monthlyBuy: year.buyOut / 12,
        monthlyRent: year.rentOut / 12,
        buyerInvested: year.buyerInvested,
        renterInvested: year.renterInvested,
        homeValue,
        balance,
        equity,
        buyerPortfolio,
        buyNet: equity + buyerPortfolio,
        rentNet: renterPortfolio,
      })
    }
  }

  return { emi, upfront: down + stampDuty, rows }
}
