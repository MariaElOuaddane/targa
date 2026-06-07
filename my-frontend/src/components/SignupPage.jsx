import { useState, useEffect } from 'react'

const API = 'http://localhost:3001/api'

export default function SignupPage({ onAuth, goPage, showToast }) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('user')
  const [ville, setVille] = useState('')
  const [telephone, setTelephone] = useState('')
  const [langues, setLangues] = useState([])
  const [specialite, setSpecialite] = useState('')
  const [description, setDescription] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/destinations`)
      .then(r => r.json())
      .then(d => { setDestinations(d); if (d.length) setVille(d[0].nom) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!prenom || !nom || !email || !password || !confirm) {
      setError('Veuillez remplir tous les champs obligatoires'); return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères'); return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas'); return
    }
    if (role === 'guide') {
      if (!ville) { setError('Veuillez sélectionner une ville'); return }
    }
    setLoading(true)
    try {
      const body = { prenom, nom, email, password, role }
      if (role === 'guide') {
        Object.assign(body, { ville, telephone, langues: langues.join(','), specialite, description, instagram, linkedin, whatsapp })
      }
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      localStorage.setItem('targa_token', data.token)
      localStorage.setItem('targa_user', JSON.stringify(data.user))
      onAuth(data.user)
      showToast('Compte créé avec succès ✦')
      goPage('profile')
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">📝</div>
          <h2>Créer un compte</h2>
          <p>Rejoignez TARGA pour planifier vos voyages</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-row">
            <div className="form-inp-wrap">
              <label className="form-lbl">Prénom</label>
              <input className="form-inp" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Votre prénom" autoFocus />
            </div>
            <div className="form-inp-wrap">
              <label className="form-lbl">Nom</label>
              <input className="form-inp" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" />
            </div>
          </div>
          <div className="form-inp-wrap">
            <label className="form-lbl">Email</label>
            <input className="form-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div className="auth-form-row">
            <div className="form-inp-wrap">
              <label className="form-lbl">Mot de passe</label>
              <input className="form-inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" />
            </div>
            <div className="form-inp-wrap">
              <label className="form-lbl">Confirmer</label>
              <input className="form-inp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" />
            </div>
          </div>
          <div className="form-inp-wrap">
            <label className="form-lbl">Je suis</label>
            <select className="form-inp" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Voyageur</option>
              <option value="guide">Guide</option>
            </select>
          </div>

          {role === 'guide' && (
            <>
              <div className="form-inp-wrap">
                <label className="form-lbl">Ville</label>
                <select className="form-inp" value={ville} onChange={e => setVille(e.target.value)}>
                  {destinations.map(d => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                </select>
              </div>
              <div className="form-inp-wrap">
                <label className="form-lbl">Téléphone</label>
                <input className="form-inp" type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+212 6XX XXX XXX" />
              </div>
              <div className="form-inp-wrap">
                <label className="form-lbl">Langues parlées</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.3rem' }}>
                  {['AR','FR','EN','ES','DE','IT','PT','TZ'].map(l => {
                    const checked = langues.includes(l)
                    return (
                      <label key={l} style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'5px 10px', borderRadius:'6px', border:'1.5px solid var(--border)', background:checked?'rgba(54,117,136,0.08)':'transparent', cursor:'pointer', fontSize:'11px', fontWeight:checked?600:400, color:checked?'var(--teal)':'var(--text-muted)', transition:'all 0.15s' }}>
                        <input type="checkbox" checked={checked} onChange={() => setLangues(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} style={{ display:'none' }} />
                        {l}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="form-inp-wrap">
                <label className="form-lbl">Spécialité</label>
                <input className="form-inp" value={specialite} onChange={e => setSpecialite(e.target.value)} placeholder="Médinas, désert, trek..." />
              </div>
              <div className="form-inp-wrap">
                <label className="form-lbl">Description</label>
                <textarea className="form-inp" style={{ minHeight:'60px' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Présentez-vous aux voyageurs..." />
              </div>
              <div className="auth-form-row">
                <div className="form-inp-wrap">
                  <label className="form-lbl">Instagram</label>
                  <input className="form-inp" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="form-inp-wrap">
                  <label className="form-lbl">LinkedIn</label>
                  <input className="form-inp" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-inp-wrap">
                  <label className="form-lbl">WhatsApp</label>
                  <input className="form-inp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+212XXXXXXXXX" />
                </div>
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
          <button className="btn-auth-submit" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <div className="auth-footer">
          Déjà un compte ?{' '}
          <button className="auth-link" onClick={() => goPage('login')}>Se connecter</button>
        </div>
      </div>
    </div>
  )
}
