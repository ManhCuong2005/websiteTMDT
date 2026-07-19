import { useEffect, useRef } from 'react'

export default function GoogleButton({ onCredential }) {
  const ref = useRef(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  useEffect(() => {
    if (!clientId) return
    const render = () => {
      if (!window.google || !ref.current) return
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) })
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: ref.current.offsetWidth, text: 'continue_with' })
    }
    if (window.google) return render()
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = render
    document.head.appendChild(script)
    return () => { script.onload = null }
  }, [clientId, onCredential])

  if (!clientId) return <button className="google-disabled" disabled>Google chưa được cấu hình</button>
  return <div className="google-button" ref={ref}/>
}
