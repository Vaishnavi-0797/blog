export default function Loader({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={fullPage ? 'loader-wrap loader-full' : 'loader-wrap'} role="status">
      <span className="spinner" />
      <span className="loader-label">{label}</span>
    </div>
  );
}
