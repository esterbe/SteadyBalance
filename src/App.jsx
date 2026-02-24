import { useState } from 'react';
import { useCloudStorage, saveImmediate } from './hooks/useCloudStorage';
import { calculateAllocation } from './logic/allocator';
import ASSETS from './data/assets';
import Header from './components/Header';
import HoldingsInput from './components/HoldingsInput';
import DepositInput from './components/DepositInput';
import ResultsTable from './components/ResultsTable';
import LoadingState from './components/LoadingState';
import PieChart from './components/PieChart';
import LoginScreen from './components/LoginScreen';
import './App.css';

const ASSET_COLORS = {
  'US Large Cap': '#4B9DA9',
  'IL Gov Bonds': '#91C6BC',
  'Europe Equities': '#E37434',
  'Emerging Markets': '#F6D862',
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sb-token'));
  const isLoggedIn = !!token;

  const [holdings, setHoldings, holdingsLoaded] = useCloudStorage(
    'holdings',
    ASSETS.map(() => 0),
    token,
    setToken,
  );
  const [deposit, setDeposit, depositLoaded] = useCloudStorage('deposit', 0, token, setToken);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [preApplyState, setPreApplyState] = useState(null);

  const handleLogin = (newToken) => {
    setToken(newToken);
    setLoggedOut(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('sb-token');
    setToken(null);
    setResults(null);
    setJustApplied(false);
    setLoggedOut(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} message={loggedOut ? 'You have been logged out successfully.' : null} />;
  }

  const dataLoaded = holdingsLoaded && depositLoaded;

  const hasDeposit = Number(deposit) > 0;
  const canCalculate = hasDeposit;

  const totalHoldings = holdings.reduce((sum, v) => sum + (Number(v) || 0), 0);

  const chartSlices = results
    ? results.map((r) => ({
        name: r.name,
        pct: r.afterPct,
        color: ASSET_COLORS[r.name],
      }))
    : totalHoldings > 0
      ? ASSETS.map((a, i) => ({
          name: a.name,
          pct: ((Number(holdings[i]) || 0) / totalHoldings) * 100,
          color: ASSET_COLORS[a.name],
        }))
      : ASSETS.map((a) => ({
          name: a.name,
          pct: a.target,
          color: ASSET_COLORS[a.name],
        }));

  const handleCalculate = () => {
    if (!canCalculate) return;
    setIsLoading(true);
    setResults(null);

    setTimeout(() => {
      const cleanHoldings = holdings.map((v) => Number(v) || 0);
      const allocation = calculateAllocation(cleanHoldings, Number(deposit) || 0, ASSETS);
      setResults(allocation);
      setIsLoading(false);
    }, 300);
  };

  const handleApply = () => {
    if (!results) return;
    // Save pre-apply state for cancel
    setPreApplyState({ holdings: [...holdings], deposit });
    const newHoldings = holdings.map((v, i) => {
      const current = Number(v) || 0;
      const buy = results[i]?.buy || 0;
      return current + buy;
    });
    // Update local state
    setHoldings(newHoldings);
    setDeposit(0);
    setResults(null);
    setJustApplied(true);
    // Single immediate save to avoid race condition
    saveImmediate({ holdings: newHoldings, deposit: 0 }, token);
  };

  const handleSave = () => {
    saveImmediate({ holdings, deposit }, token);
    setPreApplyState(null);
    setJustApplied(false);
  };

  const handleCancelApply = () => {
    if (preApplyState) {
      setHoldings(preApplyState.holdings);
      setDeposit(preApplyState.deposit);
      saveImmediate(preApplyState, token);
    }
    setPreApplyState(null);
    setJustApplied(false);
  };

  // Determine which view we're in
  const view = isLoading ? 'loading' : results ? 'results' : justApplied ? 'applied' : 'input';

  return (
    <div className="ma-app">
      <Header onLogout={handleLogout} />
      <main className="ma-main">
        {!dataLoaded ? (
          <LoadingState />
        ) : (
          <>
            <p className="ma-hint">
              {view === 'input' && 'Enter your holdings and deposit amount to see your recommended allocation.'}
              {view === 'loading' && 'Calculating recommended allocation...'}
              {view === 'results' && 'Recommended allocation for your deposit.'}
              {view === 'applied' && 'Allocation applied. Review and save your updated holdings.'}
            </p>
            <div className="ma-layout-row">
              <div className="ma-layout-left">
                {view === 'loading' ? (
                  <>
                    <h2 className="ma-section-title">Recommended Allocation</h2>
                    <LoadingState />
                  </>
                ) : view === 'results' ? (
                  <>
                    <ResultsTable results={results} deposit={deposit} />
                    <div className="ma-apply-row">
                      <button className="ma-btn ma-btn--active ma-apply-btn" onClick={handleApply}>
                        Apply Allocation
                      </button>
                      <button className="ma-btn ma-back-btn" onClick={() => setResults(null)}>
                        Back
                      </button>
                    </div>
                  </>
                ) : view === 'applied' ? (
                  <>
                    <HoldingsInput holdings={holdings} onChange={setHoldings} />
                    <section className="ma-section">
                      <div className="ma-apply-row">
                        <button className="ma-btn ma-btn--active ma-apply-btn" onClick={handleSave}>
                          Save
                        </button>
                        <button className="ma-btn ma-back-btn" onClick={handleCancelApply}>
                          Cancel
                        </button>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <HoldingsInput holdings={holdings} onChange={setHoldings} />
                    <DepositInput
                      deposit={deposit}
                      onChange={setDeposit}
                      onCalculate={handleCalculate}
                      canCalculate={canCalculate}
                    />
                  </>
                )}
              </div>
              <div className="ma-layout-right">
                <PieChart slices={chartSlices} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
