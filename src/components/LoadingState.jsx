export default function LoadingState() {
  return (
    <section className="ma-section">
      <div className="ma-loading">
        <img src="/steadybalance-logo.svg" alt="" className="ma-loading-icon" />
        <p className="ma-loading-text">Calculating optimal allocation...</p>
      </div>
    </section>
  );
}
