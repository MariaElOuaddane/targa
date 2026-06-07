import { useState, useEffect, useMemo } from 'react'

const API = 'http://localhost:3001/api'

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

export default function AllReviewsPage({ goPage, showToast, destSlug }) {
  const [reviews, setReviews] = useState([])
  const [likeData, setLikeData] = useState({})
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [destFilter, setDestFilter] = useState(destSlug || 'all')

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

  const destinations = useMemo(() => {
    const set = new Set(reviews.map(r => r.destination).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [reviews])

  const filtered = useMemo(() => {
    let list = [...reviews]
    if (destFilter !== 'all') {
      list = list.filter(r => r.destination === destFilter)
    }
    if (sortBy === 'recent') return list.reverse()
    if (sortBy === 'popular') return list.sort((a, b) => {
      const la = likeData[a.id]?.likes || 0; const lb = likeData[b.id]?.likes || 0
      return lb - la
    })
    return list
  }, [reviews, sortBy, likeData, destFilter])

  const refreshReviewLikes = async (reviewId) => {
    try {
      const res = await fetch(`${API}/ratings/review/${reviewId}`)
      if (res.ok) {
        const data = await res.json()
        setLikeData(prev => ({ ...prev, [reviewId]: data }))
      }
    } catch {}
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

  return (
    <>
      <div className="zellij"></div>
      <div className="sec">
        <button className="act-back-btn" onClick={() => goPage('avis')}>
          ← Retour
        </button>

        <div className="sec-title">Tous les avis</div>
        <div className="sec-sub">Explorez l'ensemble des témoignages de voyageurs</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        <div className="allrev-toolbar">
          <div className="flt-wrap">
            <label className="flt-label">Destination</label>
            <select className="flt-select" value={destFilter} onChange={e => setDestFilter(e.target.value)}>
              {destinations.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'Toutes les destinations' : d}</option>
              ))}
            </select>
          </div>
          <div className="flt-wrap">
            <label className="flt-label">Trier par</label>
            <select className="flt-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="recent">Plus récents</option>
              <option value="popular">Plus populaires</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rev-loading">Chargement des avis…</div>
        ) : filtered.length === 0 ? (
          <div className="rev-empty">
            <div className="rev-empty-icon">💬</div>
            <p>Aucun avis pour le moment.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {filtered.map((r, i) => {
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
        )}
      </div>
      <div className="zellij"></div>
    </>
  )
}
