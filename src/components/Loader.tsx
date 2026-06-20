export function Loader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="loader-wrap">
      <span className="spinner" />
      {label}
    </div>
  )
}
