import { useState } from 'react'

const API = 'http://localhost:3001/api'

export default function LoginPage({ onAuth, goPage, showToast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      localStorage.setItem('targa_token', data.token)
      localStorage.setItem('targa_user', JSON.stringify(data.user))
      onAuth(data.user)
      showToast('Connecté avec succès ✦')
      goPage('profile')
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-icon">🔐</div>
            <h2>Connexion</h2>
            <p>Connectez-vous pour gérer votre profil</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-inp-wrap">
              <label className="form-lbl">Email</label>
              <input className="form-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" autoFocus />
            </div>
            <div className="form-inp-wrap">
              <label className="form-lbl">Mot de passe</label>
              <input className="form-inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn-auth-submit" type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <div className="auth-footer">
            Pas encore de compte ?{' '}
            <button className="auth-link" onClick={() => goPage('signup')}>Créer un compte</button>
          </div>
        </div>
      </div>
    </>
  )
}
