import ASSETS from '../data/assets';

function formatNumber(val) {
  if (!val && val !== 0) return '';
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val;
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('en-IL');
}

function parseNumber(str) {
  const cleaned = str.replace(/[^0-9]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10);
}

export default function HoldingsInput({ holdings, onChange }) {
  const handleChange = (index, rawValue) => {
    const num = parseNumber(rawValue);
    const next = [...holdings];
    next[index] = num;
    onChange(next);
  };

  return (
    <section className="ma-section">
      <h2 className="ma-section-title">Current Holdings</h2>
      <div className="ma-cards-grid">
        {ASSETS.map((asset, i) => (
          <div
            key={asset.id}
            className={`ma-card${holdings[i] > 0 ? ' ma-card--filled' : ''}`}
          >
            <div className="ma-card-header">
              <span className="ma-card-name">{asset.name}</span>
              <span className="ma-card-target">Target {asset.target}%</span>
            </div>
            <div className="ma-card-input-row">
              <span className="ma-currency">&#8362;</span>
              <input
                type="text"
                className="ma-input"
                inputMode="numeric"
                placeholder="0"
                value={formatNumber(holdings[i])}
                onChange={(e) => handleChange(i, e.target.value)}
              />
            </div>
            <div className="ma-card-security">{asset.id}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
