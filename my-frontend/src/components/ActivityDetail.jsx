import { useState, useEffect } from 'react'
import ReservationForm from './ReservationForm'
import { API } from '../config.js'

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

export default function ActivityDetail({ activity, onClose, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)

  useEffect(() => {
    fetch(`${API}/ratings/activity/${activity.id}`)
      .then(r => r.json())
      .then(data => { setRating(data); if (data.userRating) setUserRating(data.userRating) })
      .catch(() => {})
  }, [activity.id])

  const rateActivity = async (n) => {
    const token = localStorage.getItem('targa_token')
    if (!token) { showToast('Connectez-vous pour noter cette activité'); return }
    try {
      const res = await fetch(`${API}/ratings/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ activity_id: activity.id, rating: n }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUserRating(n)
      setRating(prev => ({ ...prev, average: data.average, count: data.count }))
      showToast('Note enregistrée !')
    } catch { showToast('Erreur') }
  }

  const handleReserve = async (data) => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      showToast('Réservation confirmée ! Vous recevrez une confirmation par email.')
      setShowForm(false)
      onClose()
    } catch {
      showToast('Erreur lors de la réservation. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="detail-hero">{CATEGORY_ICON[activity.categorie] || '✦'}</div>
        <div className="detail-body">
          <div className="detail-badges">
            <span className="act-tag">{activity.categorie}</span>
            <span className="act-city-tag">{activity.ville}</span>
          </div>
          <h2 className="detail-title">{activity.titre}</h2>
          <p className="detail-desc">{activity.description}</p>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-meta-icon">💰</span>
              <span className="detail-meta-val">{activity.prix} MAD</span>
              <span className="detail-meta-key">Prix</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">⭐</span>
              <span className="detail-meta-val">
                {rating ? `${rating.average?.toFixed(1) || '—'} (${rating.count})` : '⏳'}
              </span>
              <span className="detail-meta-key">Note</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📁</span>
              <span className="detail-meta-val">{activity.categorie}</span>
              <span className="detail-meta-key">Catégorie</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-icon">📍</span>
              <span className="detail-meta-val">{activity.ville}</span>
              <span className="detail-meta-key">Ville</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            {rating && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '2px' }}>
                  {'★'.repeat(Math.round(rating.average || 0))}{'☆'.repeat(5 - Math.round(rating.average || 0))}
                </span>
                <span style={{ marginLeft: '0.4rem' }}>{rating.average?.toFixed(1) || '—'} · {rating.count} avis</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '0.3rem' }}>Votre note:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)} onClick={() => rateActivity(n)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: n <= (hoverStar || userRating) ? 'var(--gold)' : 'var(--border)', padding: '0', lineHeight: '1', transition: 'color 0.15s' }}>
                  ★
                </button>
              ))}
            </div>
          </div>

          {!showForm ? (
            <button className="btn-reserve" onClick={() => setShowForm(true)}>
              ✦ Réserver cette activité
            </button>
          ) : (
            <ReservationForm
              activityId={activity.id}
              onSubmit={handleReserve}
              onCancel={() => setShowForm(false)}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}
