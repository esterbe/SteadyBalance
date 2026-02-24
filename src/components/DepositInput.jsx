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

export default function DepositInput({ deposit, onChange, onCalculate, canCalculate }) {
  const handleChange = (rawValue) => {
    onChange(parseNumber(rawValue));
  };

  return (
    <section className="ma-section">
      <h2 className="ma-section-title">Current Deposit</h2>
      <div className="ma-deposit-card">
        <span className="ma-currency-lg">&#8362;</span>
        <input
          type="text"
          className="ma-deposit-input"
          inputMode="numeric"
          placeholder="Enter deposit amount"
          value={formatNumber(deposit)}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <button
        className={`ma-btn${canCalculate ? ' ma-btn--active' : ''}`}
        onClick={canCalculate ? onCalculate : undefined}
      >
        Calculate Allocation
      </button>
    </section>
  );
}
