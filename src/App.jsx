import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateAllocation } from './logic/allocator';
import ASSETS from './data/assets';
import Header from './components/Header';
import HoldingsInput from './components/HoldingsInput';
import DepositInput from './components/DepositInput';
import ResultsTable from './components/ResultsTable';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import './App.css';

function App() {
  const [holdings, setHoldings] = useLocalStorage(
    'sb-holdings',
    ASSETS.map(() => 0),
  );
  const [deposit, setDeposit] = useLocalStorage('sb-deposit', 0);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasDeposit = Number(deposit) > 0;
  const canCalculate = hasDeposit;

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

  return (
    <div className="ma-app">
      <Header />
      <main className="ma-main">
        <HoldingsInput holdings={holdings} onChange={setHoldings} />
        <DepositInput
          deposit={deposit}
          onChange={setDeposit}
          onCalculate={handleCalculate}
          canCalculate={canCalculate}
        />
        {isLoading ? (
          <LoadingState />
        ) : results ? (
          <ResultsTable results={results} deposit={deposit} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

export default App;
