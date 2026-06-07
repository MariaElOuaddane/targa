import { useState, useEffect, useMemo } from 'react'
import { API } from '../config.js'

const DESTINATIONS = [
  "Marrakech","Fès","Merzouga","Essaouira","Chefchaouen","Agadir & Côte",
  "Haut Atlas & Toubkal","Ouarzazate & Aït Benhaddou","Rabat","Tanger","Vallée du Dadès"
]

const AVATAR_COLORS = ['#bc4f00','#88532f','#367588','#2a5a6b','#9cd4ce','#a84400']

function getInitials(prenom, nom) {
  return (prenom[0] + nom[0]).toUpperCase()
}

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getToken() {
  return localStorage.getItem('targa_token') || ''
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('targa_user') || '{}') } catch { return {} }
}

export default function AvisPage({ goPage, showToast, destSlug }) {
  const [dest, setDest] = useState(destSlug || '')
  const [txt, setTxt] = useState('')
  const [reviews, setReviews] = useState([])
  const [likeData, setLikeData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API}/evaluations`)
      .then(r => r.json())
      .then(data => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (reviews.length === 0) return
    const data = {}
    for (const r of reviews) {
      data[r.id] = { likes: r.likes || 0, dislikes: r.dislikes || 0 }
    }
    setLikeData(data)
  }, [reviews.length, loading])

  const sortedReviews = useMemo(() => {
    let list = [...reviews]
    if (destSlug) {
      list = list.filter(r => r.destination && destSlug.toLowerCase().includes(r.destination.toLowerCase()))
    }
    if (sortBy === 'recent') return list.reverse()
    if (sortBy === 'popular') return list.sort((a, b) => {
      const la = likeData[a.id]?.likes || 0; const lb = likeData[b.id]?.likes || 0
      return lb - la
    })
    return list
  }, [reviews, sortBy, likeData, destSlug])

  const validate = () => {
    const e = {}
    if (!dest) e.dest = 'Choisissez une destination'
    if (!txt.trim()) e.txt = 'Requis'
    else if (txt.trim().length < 10) e.txt = 'Minimum 10 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const refreshReviewLikes = async (reviewId) => {
    try {
      const res = await fetch(`${API}/ratings/review/${reviewId}`)
      if (res.ok) {
        const data = await res.json()
        setLikeData(prev => ({ ...prev, [reviewId]: data }))
      }
    } catch {}
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    const user = getUser()
    const review = {
      auteur_prenom: user.prenom || 'Anonyme',
      auteur_nom: user.nom || 'Voyageur',
      destination: dest,
      commentaire: txt.trim(),
      user_id: user.id || null,
    }
    try {
      const res = await fetch(`${API}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(review),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setReviews(prev => [saved, ...prev])
      setDest(''); setTxt('')
      setErrors({})
      showToast('Merci ! Votre avis a été publié ✦')
    } catch {
      showToast('Erreur lors de la publication. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (reviewId, action) => {
    const token = getToken()
    if (!token) { showToast('Connectez-vous pour voter'); return }
    const ld = likeData[reviewId]
    try {
      if (ld?.userAction === action) {
        const res = await fetch(`${API}/ratings/review/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ review_id: reviewId }),
        })
        if (!res.ok) throw new Error()
        await refreshReviewLikes(reviewId)
        return
      }
      const endpoint = action === 'like' ? 'like' : 'dislike'
      const res = await fetch(`${API}/ratings/review/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ review_id: reviewId }),
      })
      if (!res.ok) throw new Error()
      await refreshReviewLikes(reviewId)
    } catch { showToast('Erreur') }
  }

  const user = getUser()
  const isConnected = getToken() && user.id

  return (
    <>
      <div className="zellij"></div>
      <div className="sec">
        <div className="sec-title">Espace Avis</div>
        <div className="sec-sub">Partagez votre expérience et découvrez les témoignages des voyageurs</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        <div className="avis-layout">
          <div className="rev-form-card">
            <h3 className="rev-form-heading">✦ Publier un avis</h3>

            {isConnected && (
              <div className="rev-user-badge">
                <span className="rev-user-avatar">{getInitials(user.prenom || '', user.nom || '')}</span>
                <span className="rev-user-name">{user.prenom} {user.nom}</span>
              </div>
            )}

            <div className="form-inp-wrap" style={{ marginBottom: '1.2rem' }}>
              <label className="form-lbl">Destination</label>
              <select className={`form-select ${errors.dest ? 'error' : ''}`} value={dest} onChange={e => setDest(e.target.value)}>
                <option value="">— Choisir une destination —</option>
                {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              {errors.dest && <span className="form-err">{errors.dest}</span>}
            </div>

            <div className="form-inp-wrap" style={{ marginBottom: '1.2rem' }}>
              <label className="form-lbl">Votre expérience</label>
              <textarea className={`form-textarea ${errors.txt ? 'error' : ''}`} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Racontez votre aventure au Maroc… Dites-nous ce qui vous a marqué, les lieux découverts, les rencontres…" rows={5} maxLength={1000}></textarea>
              <div className="rev-chars"><span>{txt.length}</span>/1000</div>
              {errors.txt && <span className="form-err">{errors.txt}</span>}
            </div>

            {!isConnected && (
              <p className="rev-login-hint">Connectez-vous pour publier un avis.</p>
            )}

            <button className="btn-rev-submit" onClick={submit} disabled={submitting || !isConnected}>
              {submitting ? (
                <><span className="rev-spinner"></span> Publication…</>
              ) : '✦ Publier mon avis'}
            </button>
          </div>

          <div>
            <div className="rev-list-header">
              <span className="rev-list-title">✦ Témoignages</span>
              <select className="rev-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="recent">Plus récents</option>
                <option value="popular">Plus populaires</option>
              </select>
            </div>

            {loading ? (
              <div className="rev-loading">Chargement des avis…</div>
            ) : sortedReviews.length === 0 ? (
              <div className="rev-empty">
                <div className="rev-empty-icon">💬</div>
                <p>Aucun avis pour le moment.<br />Soyez le premier à partager votre expérience !</p>
              </div>
            ) : (
              <>
                <div className="reviews-list">
                  {sortedReviews.slice(0, 5).map((r, i) => {
                    const ld = likeData[r.id]
                    return (
                      <div className="review-card" key={r.id || i}>
                        <div className="review-header">
                          <div className="review-avatar" style={{ background: getAvatarColor(r.auteur_prenom + r.auteur_nom) }}>
                            {getInitials(r.auteur_prenom, r.auteur_nom)}
                          </div>
                          <div className="review-meta">
                            <div className="review-author">{r.auteur_prenom} {r.auteur_nom}</div>
                            <div className="review-sub">
                              {r.destination && <span className="review-dest">{r.destination}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="review-txt">{r.commentaire || r.txt}</div>
                        <div className="review-footer">
                          <div className="review-date">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' }) : ''}
                          </div>
                          <div className="review-votes">
                            <button className={`vote-btn ${ld?.userAction === 'liked' ? 'voted-like' : ''}`} onClick={() => handleVote(r.id, 'like')}>
                              👍 <span>{ld?.likes || 0}</span>
                            </button>
                            <button className={`vote-btn ${ld?.userAction === 'disliked' ? 'voted-dislike' : ''}`} onClick={() => handleVote(r.id, 'dislike')}>
                              👎 <span>{ld?.dislikes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {sortedReviews.length > 5 && (
                  <div className="rev-see-all-wrap">
                    <button className="rev-see-all" onClick={() => goPage('tous-avis')}>
                      Voir tous les avis ({sortedReviews.length}) ✦
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="zellij"></div>
    </>
  )
}
