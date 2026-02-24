export default function EmptyState() {
  return (
    <section className="ma-section ma-results-empty">
      <div className="ma-empty-state">
        <img src="/steadybalance-logo.svg" alt="" className="ma-empty-icon" />
        <p className="ma-empty-text">
          Enter your holdings and deposit amount to see your recommended allocation.
        </p>
      </div>
    </section>
  );
}
