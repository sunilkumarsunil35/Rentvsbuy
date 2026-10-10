import { useMemo, useState } from 'react'
import { simulate } from './calc.js'
import { money } from './format.js'
import NetWorthChart from './NetWorthChart.jsx'

const FIELDS = [
  { key: 'homePrice', label: 'Home price', unit: '₹', step: 100000 },
  { key: 'downPct', label: 'Down payment', unit: '%', step: 1 },
  { key: 'ratePct', label: 'Home loan rate', unit: '%', step: 0.05 },
  { key: 'termYears', label: 'Loan term', unit: 'yrs', step: 5 },
  { key: 'rent', label: 'Monthly rent', unit: '₹', step: 1000 },
  { key: 'investPct', label: 'Investment return / yr', unit: '%', step: 0.5 },
  { key: 'years', label: 'Years you plan to stay', unit: 'yrs', step: 1 },
]

const ADVANCED = [
  { key: 'appreciationPct', label: 'Home price growth / yr', unit: '%', step: 0.5 },
  { key: 'rentIncreasePct', label: 'Rent increase / yr', unit: '%', step: 0.5 },
  { key: 'taxPct', label: 'Property tax / yr', unit: '%', step: 0.1 },
  { key: 'maintPct', label: 'Maintenance & society / yr', unit: '%', step: 0.1 },
  { key: 'insurance', label: 'Home insurance / yr', unit: '₹', step: 1000 },
  { key: 'closingPct', label: 'Stamp duty & registration', unit: '%', step: 0.5 },
  { key: 'sellPct', label: 'Selling costs (brokerage)', unit: '%', step: 0.5 },
]

const DEFAULTS = {
  homePrice: 8000000,
  downPct: 20,
  ratePct: 8.5,
  termYears: 20,
  rent: 25000,
  years: 10,
  appreciationPct: 5,
  rentIncreasePct: 5,
  investPct: 10,
  taxPct: 0.1,
  maintPct: 0.5,
  insurance: 5000,
  closingPct: 7,
  sellPct: 2,
}

function Field({ f, value, onChange }) {
  return (
    <label className="field">
      <span>{f.label}</span>
      <div className="input">
        {f.unit === '₹' && <em>₹</em>}
        <input
          type="number"
          min="0"
          step={f.step}
          value={value}
          onChange={(e) => onChange(f.key, e.target.value)}
        />
        {f.unit !== '₹' && <em>{f.unit}</em>}
      </div>
    </label>
  )
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showTable, setShowTable] = useState(false)

  const onChange = (key, raw) => setInputs((s) => ({ ...s, [key]: raw }))

  // Coerce to numbers; clamp years/term to at least 1
  const params = useMemo(() => {
    const p = {}
    for (const k of Object.keys(DEFAULTS)) p[k] = Math.max(0, Number(inputs[k]) || 0)
    p.years = Math.min(50, Math.max(1, Math.round(p.years)))
    p.termYears = Math.max(1, Math.round(p.termYears))
    p.downPct = Math.min(100, p.downPct)
    return p
  }, [inputs])

  const { emi, upfront, rows } = useMemo(() => simulate(params), [params])
  const first = rows[0]
  const last = rows[rows.length - 1]
  const buyWins = last.buyNet >= last.rentNet
  const diff = Math.abs(last.buyNet - last.rentNet)
  const breakEven = rows.find((r) => r.buyNet >= r.rentNet)
  const firstGap = first.monthlyBuy - first.monthlyRent

  return (
    <main>
      <header>
        <h1>Rent vs Buy</h1>
        <p>A quick estimate of which leaves you wealthier over time.</p>
      </header>

      <section className="card">
        <div className="grid">
          {FIELDS.map((f) => (
            <Field key={f.key} f={f} value={inputs[f.key]} onChange={onChange} />
          ))}
        </div>
        <button className="link" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? 'Hide' : 'Show'} more assumptions
        </button>
        {showAdvanced && (
          <div className="grid">
            {ADVANCED.map((f) => (
              <Field key={f.key} f={f} value={inputs[f.key]} onChange={onChange} />
            ))}
          </div>
        )}
      </section>

      <section className={`card verdict ${buyWins ? 'buy' : 'rent'}`}>
        <h2>{buyWins ? 'Buying' : 'Renting'} comes out ahead</h2>
        <p>
          After {params.years} year{params.years > 1 ? 's' : ''}, {buyWins ? 'buying' : 'renting'} leaves
          you about <strong>{money(diff)}</strong> better off.
        </p>
        <p className="muted">
          {breakEven
            ? `Buying overtakes renting in year ${breakEven.year}.`
            : `Buying doesn't catch up with renting within ${params.years} years.`}
        </p>
        <div className="stats">
          <div><span>Net worth if buying</span><b>{money(last.buyNet)}</b></div>
          <div><span>Net worth if renting</span><b>{money(last.rentNet)}</b></div>
          <div><span>Monthly EMI</span><b>{money(emi)}</b></div>
          <div><span>Cash needed to buy</span><b>{money(upfront)}</b></div>
        </div>
      </section>

      <section className="card">
        <h3>Monthly cash flow (year 1)</h3>
        <div className="flow">
          <div>
            <span>Buying costs / month</span>
            <b>{money(first.monthlyBuy)}</b>
            <small>EMI + property tax + maintenance + insurance</small>
          </div>
          <div>
            <span>Rent / month</span>
            <b>{money(first.monthlyRent)}</b>
            <small>grows {params.rentIncreasePct}% every year</small>
          </div>
          <div className="highlight">
            <span>{firstGap >= 0 ? 'Renter invests' : 'Buyer invests'} / month</span>
            <b>{money(Math.abs(firstGap))}</b>
            <small>at {params.investPct}% a year, compounded monthly</small>
          </div>
        </div>
        <p className="muted small">
          The renter also invests the {money(upfront)} a buyer would spend on the down payment and
          stamp duty. This comparison is redone every month, so as rent rises (or the loan is paid
          off) the side that invests can switch.
        </p>
      </section>

      <section className="card">
        <h3>Net worth by year</h3>
        <div className="legend">
          <span><i className="key buy" /> Buy (home equity after selling costs + investments)</span>
          <span><i className="key rent" /> Rent (investments)</span>
        </div>
        <NetWorthChart rows={rows} />
        <button className="link" onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Hide' : 'Show'} year-by-year table
        </button>
        {showTable && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Buy cost / mo</th>
                  <th>Rent / mo</th>
                  <th>Renter invested (yr)</th>
                  <th>Buyer invested (yr)</th>
                  <th>Home equity</th>
                  <th>Buy net worth</th>
                  <th>Rent net worth</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.year}>
                    <td>{r.year}</td>
                    <td>{money(r.monthlyBuy)}</td>
                    <td>{money(r.monthlyRent)}</td>
                    <td>{money(r.renterInvested)}</td>
                    <td>{money(r.buyerInvested)}</td>
                    <td>{money(r.equity)}</td>
                    <td className={r.buyNet >= r.rentNet ? 'win' : ''}>{money(r.buyNet)}</td>
                    <td className={r.rentNet > r.buyNet ? 'win' : ''}>{money(r.rentNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="muted">
        Estimates only — not financial advice. Ignores taxes on gains and home loan tax benefits.
      </footer>
    </main>
  )
}
