export default function ResultsTable({ results, deposit }) {
  return (
    <section className="ma-section">
      <h2 className="ma-section-title">Recommended Allocation</h2>
      <div className="ma-results-table">
        <div className="ma-results-header">
          <span>Asset</span>
          <span>Before</span>
          <span>Buy</span>
          <span>After</span>
          <span>Target</span>
        </div>
        {results.map((r) => (
          <div key={r.id} className="ma-results-row">
            <span className="ma-results-name">{r.name}</span>
            <span
              className={`ma-results-pct ${Math.abs(r.currentPct - r.targetPct) > 1 ? 'ma-pct--off' : ''}`}
            >
              {r.currentPct.toFixed(1)}%
            </span>
            <span className="ma-results-buy">
              {r.buy > 0 ? `\u20AA${r.buy.toLocaleString()}` : '\u2014'}
            </span>
            <span className="ma-results-pct ma-pct--good">
              {r.afterPct.toFixed(1)}%
            </span>
            <span className="ma-results-target">{r.targetPct}%</span>
          </div>
        ))}
      </div>
      <div className="ma-total-row">
        <span>Total Buy</span>
        <span className="ma-total-amount">{'\u20AA'}{deposit.toLocaleString()}</span>
      </div>
    </section>
  );
}
