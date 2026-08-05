import avitoLogo from '@/assets/avitoNotBackground.svg'

export function AvitoLogo() {
  return (
    <div className="avito-static-logo" aria-label="Авито">
      <img alt="" src={avitoLogo} />
      <strong>Avito</strong>
    </div>
  )
}
