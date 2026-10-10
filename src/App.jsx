import { useMemo, useState } from 'react'
import { compare } from './calc.js'

const FIELDS = [
  { key: 'homePrice', label: 'Home price', unit: '$', step: 5000 },
  { key: 'downPct', label: 'Down payment', unit: '%', step: 1 },
  { key: 'ratePct', label: 'Mortgage rate', unit: '%', step: 0.125 },
  { key: 'termYears', label: 'Loan term', unit: 'yrs', step: 5 },
  { key: 'rent', label: 'Monthly rent', unit: '$', step: 50 },
  { key: 'years', label: 'Years you plan to stay', unit: 'yrs', step: 1 },
]

const ADVANCED = [
  { key: 'appreciationPct', label: 'Home price growth / yr', unit: '%', step: 0.5 },
  { key: 'rentIncreasePct', label: 'Rent increase / yr', unit: '%', step: 0.5 },
  { key: 'investPct', label: 'Investment return / yr', unit: '%', step: 0.5 },
  { key: 'taxPct', label: 'Property tax / yr', unit: '%', step: 0.1 },
  { key: 'maintPct', label: 'Maintenance / yr', unit: '%', step: 0.1 },
  { key: 'insurance', label: 'Home insurance / yr', unit: '$', step: 100 },
  { key: 'closingPct', label: 'Closing costs (buy)', unit: '%', step: 0.5 },
  { key: 'sellPct', label: 'Selling costs', unit: '%', step: 0.5 },
]

const DEFAULTS = {
  homePrice: 400000,
  downPct: 20,
  ratePct: 6.5,
  termYears: 30,
  rent: 2000,
  years: 10,
  appreciationPct: 3,
  rentIncreasePct: 3,
  investPct: 6,
  taxPct: 1.1,
  maintPct: 1,
  insurance: 1500,
  closingPct: 3,
  sellPct: 6,
}

const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Field({ f, value, onChange }) {
  return (
    <label className="field">
      <span>{f.label}</span>
      <div className="input">
        {f.unit === '$' && <em>$</em>}
        <input
          type="number"
          min="0"
          step={f.step}
          value={value}
          onChange={(e) => onChange(f.key, e.target.value)}
        />
        {f.unit !== '$' && <em>{f.unit}</em>}
      </div>
    </label>
  )
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  const { payment, upfront, rows } = useMemo(() => compare(params), [params])
  const last = rows[rows.length - 1]
  const buyWins = last.buyNet >= last.rentNet
  const diff = Math.abs(last.buyNet - last.rentNet)
  const breakEven = rows.find((r) => r.buyNet >= r.rentNet)
  const max = Math.max(...rows.map((r) => Math.max(r.buyNet, r.rentNet, 0)), 1)

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
            ? `Buying breaks even in year ${breakEven.year}.`
            : `Buying doesn't break even within ${params.years} years.`}
        </p>
        <div className="stats">
          <div><span>Monthly mortgage</span><b>{money(payment)}</b></div>
          <div><span>Cash needed to buy</span><b>{money(upfront)}</b></div>
          <div><span>Net worth if buying</span><b>{money(last.buyNet)}</b></div>
          <div><span>Net worth if renting</span><b>{money(last.rentNet)}</b></div>
        </div>
      </section>

      <section className="card">
        <h3>Net worth by year</h3>
        <div className="legend">
          <span className="dot buy" /> Buy <span className="dot rent" /> Rent
        </div>
        <div className="bars">
          {rows.map((r) => (
            <div className="bar-row" key={r.year}>
              <span className="yr">Y{r.year}</span>
              <div className="pair">
                <div className="bar buy" style={{ width: `${(Math.max(r.buyNet, 0) / max) * 100}%` }} title={money(r.buyNet)} />
                <div className="bar rent" style={{ width: `${(Math.max(r.rentNet, 0) / max) * 100}%` }} title={money(r.rentNet)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="muted">
        Assumes both options start with the same cash, and whichever is cheaper each year invests
        the savings. Estimates only — not financial advice.
      </footer>
    </main>
  )
}
