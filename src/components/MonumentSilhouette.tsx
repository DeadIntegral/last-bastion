export function MonumentSilhouette({ index }: { index: number }) {
  return <svg className={`monument-silhouette monument-shape-${index}`} viewBox="0 0 100 120" aria-hidden="true">
    <ellipse cx="50" cy="108" rx="43" ry="9" fill="#09151bcc" />
    <path d="M12 100 50 88 88 100 50 114Z" fill="#899585" stroke="#d5c598" />
    <path d="M22 88 50 80 78 88 78 100 50 108 22 100Z" fill="#414f51" stroke="#adac8a" />
    {index === 4 ? <><path d="M28 88V30h44v58H60V48H40v40Z" fill="#788384" stroke="#e5c982" strokeWidth="2" /><path d="m25 30 25-14 25 14-25 7Z" fill="#c3a766" /></> : <>
      <path d="m38 88 2-54 10-10 10 10 2 54-12 5Z" fill="#75858a" stroke="#d1c08d" strokeWidth="2" />
      <path d="M50 24v69l12-5-2-54Z" fill="#35454d" />
      {index === 0 ? <><path d="M50 29V7" stroke="#edce83" strokeWidth="3" /><path d="M51 8h24L65 21H51Z" fill="#75bec7" /></> : index === 1 ? <><circle cx="50" cy="18" r="8" fill="#dfcb95" /><path d="m50 27-15 15 15 5 15-5Z" fill="#cab175" /></> : index === 2 ? <path d="m50 7 15 18-15 18-15-18Z" fill="#cba35c" stroke="#f5e0a1" strokeWidth="2" /> : <path d="m50 5 10 20-10 18-10-18Z" fill="#a5dce5" stroke="#e8ffff" strokeWidth="2" />}
    </>}
    <path d="m34 96 16 4 16-4" fill="none" stroke="#e3c888" strokeWidth="2" />
  </svg>;
}
