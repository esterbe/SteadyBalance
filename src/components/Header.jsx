export default function Header({ onLogout }) {
  return (
    <header className="ma-header">
      <img src="/steadybalance-logo.svg" alt="SteadyBalance" className="ma-logo" />
      <div className="ma-header-text">
        <span className="ma-title">Steady Balance</span>
        <span className="ma-subtitle">Portfolio Rebalancing Tool</span>
      </div>
      <span className="ma-version">v{__APP_VERSION__}</span>
      {onLogout && (
        <button className="ma-logout-btn" onClick={onLogout}>
          Logout
        </button>
      )}
    </header>
  );
}
