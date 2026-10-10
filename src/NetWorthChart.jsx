import { useEffect, useRef, useState } from 'react'
import { money, moneyShort } from './format.js'

const HEIGHT = 300
const PAD = { top: 16, right: 76, bottom: 32, left: 64 }

// Pick a "nice" tick step so we get roughly `count` gridlines
function niceStep(range, count) {
  const raw = range / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

export default function NetWorthChart({ rows }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Year 0 = starting position (same cash on both sides, buyer's equity after costs)
  const points = rows
  const n = points.length
  const values = points.flatMap((r) => [r.buyNet, r.rentNet])
  const lo = Math.min(0, ...values)
  const hi = Math.max(...values, 1)
  const step = niceStep(hi - lo, 4)
  const yMin = Math.floor(lo / step) * step
  const yMax = Math.ceil(hi / step) * step
  const ticks = []
  for (let v = yMin; v <= yMax + step / 2; v += step) ticks.push(v)

  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (i) => PAD.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH
  const path = (key) => points.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r[key])}`).join('')

  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(plotW / 48)))
  const breakEven = points.findIndex((r) => r.buyNet >= r.rentNet)
  const last = points[n - 1]

  // Keep the two end labels from overlapping
  let buyLabelY = y(last.buyNet)
  let rentLabelY = y(last.rentNet)
  if (Math.abs(buyLabelY - rentLabelY) < 16) {
    const mid = (buyLabelY + rentLabelY) / 2
    const up = last.buyNet >= last.rentNet
    buyLabelY = mid + (up ? -8 : 8)
    rentLabelY = mid + (up ? 8 : -8)
  }

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = n === 1 ? 0 : Math.round(((px - PAD.left) / plotW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  const h = hover != null ? points[hover] : null
  const tipLeft = h ? Math.min(Math.max(x(hover) + 12, 0), width - 190) : 0
  const flip = h && x(hover) + 200 > width

  return (
    <div className="chart" ref={wrapRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Net worth by year for buying and renting"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis' : 'grid'} x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="tick" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {moneyShort(t)}
            </text>
          </g>
        ))}
        {points.map((r, i) =>
          (n - 1 - i) % labelEvery === 0 ? (
            <text key={r.year} className="tick" x={x(i)} y={HEIGHT - 10} textAnchor="middle">
              Y{r.year}
            </text>
          ) : null,
        )}

        {breakEven > 0 && (
          <g>
            <line className="marker" x1={x(breakEven)} x2={x(breakEven)} y1={PAD.top} y2={PAD.top + plotH} />
            <text className="tick" x={x(breakEven) + 4} y={PAD.top + 10}>
              break-even
            </text>
          </g>
        )}

        <path className="line rent" d={path('rentNet')} />
        <path className="line buy" d={path('buyNet')} />

        <text className="end-label" x={x(n - 1) + 8} y={rentLabelY} dy="0.32em">
          Rent
        </text>
        <text className="end-label" x={x(n - 1) + 8} y={buyLabelY} dy="0.32em">
          Buy
        </text>

        {h && (
          <g>
            <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} />
            <circle className="dot buy" cx={x(hover)} cy={y(h.buyNet)} r="4.5" />
            <circle className="dot rent" cx={x(hover)} cy={y(h.rentNet)} r="4.5" />
          </g>
        )}
        {/* full-height hit area */}
        <rect x={PAD.left - 10} y={PAD.top} width={plotW + 20} height={plotH} fill="transparent" />
      </svg>

      {h && (
        <div className="tooltip" style={{ left: flip ? x(hover) - 200 : tipLeft, top: PAD.top }}>
          <div className="tip-title">Year {h.year}</div>
          <div className="tip-row"><i className="key buy" /><b>{money(h.buyNet)}</b><span>Buy</span></div>
          <div className="tip-row"><i className="key rent" /><b>{money(h.rentNet)}</b><span>Rent</span></div>
        </div>
      )}
    </div>
  )
}
