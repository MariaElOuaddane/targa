const AVATAR_COLORS = ['#bc4f00', '#88532f', '#367588', '#2a5a6b', '#9cd4ce', '#a84400']

function getInitials(prenom, nom) {
  return (prenom[0] + nom[0]).toUpperCase()
}

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

import { useState, useEffect } from 'react'
import { API } from '../config.js'

function getToken() {
  return localStorage.getItem('targa_token') || ''
}

export default function ProfilePage({ user: propUser, onLogout, goPage, showToast }) {
  const [user, setUser] = useState(propUser)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!propUser) { goPage('login'); return }
    const token = getToken()
    if (!token) return
    fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setUser(data); localStorage.setItem('targa_user', JSON.stringify(data)) })
      .catch(() => {})
  }, [propUser, goPage])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/evaluations`)
      .then(r => r.json())
      .then(data => setReviews(data.filter(r => r.user_id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const handleLogout = () => {
    onLogout()
    showToast('Déconnecté')
    goPage('accueil')
  }

  const guideInfo = user.guide

  const date = new Date(user.created_at).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const roleBadge = (role) => {
    const config = {
      admin: { label: 'Administrateur', bg: 'rgba(188,79,0,0.1)', color: 'var(--copper)' },
      guide: { label: 'Guide', bg: 'rgba(232,200,122,0.12)', color: '#8B6500' },
      user: { label: 'Voyageur', bg: 'rgba(54,117,136,0.08)', color: 'var(--teal)' },
    }
    const c = config[role] || config.user
    return (
      <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:'20px', background:c.bg, color:c.color, fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'0.3rem' }}>
        {c.label}
      </span>
    )
  }

  return (
    <>
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth:'520px' }}>
          <div className="auth-card-header">
            <div className="profile-avatar" style={{ background: getAvatarColor(user.prenom + user.nom) }}>
              {getInitials(user.prenom, user.nom)}
            </div>
            <h2>{user.prenom} {user.nom}</h2>
            <p>{user.email}</p>
            {roleBadge(user.role)}
          </div>
          <div className="profile-body">
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-icon">📅</span>
                <span className="profile-info-val">Membre depuis le {date}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-icon">🆔</span>
                <span className="profile-info-val">#{user.id}</span>
              </div>
              {guideInfo && (
                <>
                  <div className="profile-info-item">
                    <span className="profile-info-icon">📍</span>
                    <span className="profile-info-val">{guideInfo.ville || 'Ville non définie'}</span>
                  </div>
                  {guideInfo.telephone && (
                    <div className="profile-info-item">
                      <span className="profile-info-icon">📞</span>
                      <span className="profile-info-val">{guideInfo.telephone}</span>
                    </div>
                  )}
                  {guideInfo.langues && (
                    <div className="profile-info-item">
                      <span className="profile-info-icon">🗣️</span>
                      <span className="profile-info-val">{guideInfo.langues}</span>
                    </div>
                  )}
                  {guideInfo.specialite && (
                    <div className="profile-info-item">
                      <span className="profile-info-icon">✨</span>
                      <span className="profile-info-val">{guideInfo.specialite}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* User's reviews */}
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--teal)', marginBottom:'0.8rem', paddingBottom:'0.5rem', borderBottom:'1px solid var(--border)' }}>
                ✦ Mes avis ({reviews.length})
              </div>
              {loading ? (
                <div style={{ fontSize:'12px', color:'var(--text-muted)', textAlign:'center', padding:'1rem' }}>Chargement…</div>
              ) : reviews.length === 0 ? (
                <div style={{ fontSize:'12px', color:'var(--text-muted)', textAlign:'center', padding:'1rem', fontStyle:'italic' }}>
                  Vous n'avez pas encore publié d'avis.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
                  {reviews.slice(0, 5).map((r, i) => (
                    <div key={r.id || i} style={{ background:'var(--sand)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.8rem 1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
                        {r.destination && <span style={{ fontSize:'9px', color:'var(--copper)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>{r.destination}</span>}
                      </div>
                      <div style={{ fontSize:'12px', color:'var(--text)', lineHeight:1.5, fontWeight:300 }}>{r.commentaire}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'0.4rem' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-actions">
              <button className="btn-auth-submit btn-logout" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
