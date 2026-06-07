import { useState, useEffect } from 'react'

const API = 'http://localhost:3001/api'

const VILLE_MAP = {
  'Marrakech':'Marrakech','Fès':'Fès','Chefchaouen':'Chefchaouen',
  'Essaouira':'Essaouira','Ouarzazate':'Ouarzazate','Rabat':'Rabat',
  'Tanger':'Tanger','Merzouga':'Merzouga','Agadir & Côte':'Agadir & Taghazout',
  'Haut Atlas':'Haut Atlas (Imlil/Toubkal)','Vallée Dadès':'Vallée du Dadès',
}

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

export default function GuideDetail({ guide, onClose, showToast }) {
  const [rating, setRating] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetch(`${API}/ratings/guide/${guide.id}`)
      .then(r => r.json())
      .then(data => { setRating(data); if (data.userRating) setUserRating(data.userRating) })
      .catch(() => {})
  }, [guide.id])

  useEffect(() => {
    fetch(`${API}/activities`)
      .then(r => r.json())
      .then(data => {
        const actVille = Object.entries(VILLE_MAP).find(([, v]) => v === guide.ville)?.[0] || guide.ville
        setActivities(data.filter(a => a.ville === actVille || a.ville === guide.ville))
      })
      .catch(() => {})
  }, [guide.ville])

  const rateGuide = async (n) => {
    const token = localStorage.getItem('targa_token')
    if (!token) { showToast('Connectez-vous pour noter ce guide'); return }
    try {
      const res = await fetch(`${API}/ratings/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ guide_id: guide.id, rating: n }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUserRating(n)
      setRating(prev => ({ ...prev, average: data.average, count: data.count }))
      showToast('Note enregistrée !')
    } catch { showToast('Erreur') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="detail-hero" style={{ fontSize:'3.5rem' }}>{'👤'}</div>
        <div className="detail-body">
          <div style={{ textAlign:'center', marginBottom:'1.2rem' }}>
            <div className="detail-title">{guide.prenom} {guide.nom}</div>
            <div style={{ fontSize:'11px', letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.7, marginTop:'0.3rem', color:'var(--copper)' }}>{guide.ville} · Guide certifié</div>
          </div>

          {guide.langues && (
            <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.2rem', justifyContent:'center', flexWrap:'wrap' }}>
              {guide.langues.split(',').map((l, i) => (
                <span key={i} className="lang-b">{l.trim()}</span>
              ))}
            </div>
          )}

          <div style={{ textAlign:'center', marginBottom:'1.2rem' }}>
            {rating && (
              <div style={{ fontSize:'13px', color:'var(--muted)', marginBottom:'0.5rem' }}>
                <span style={{ color:'var(--gold)', fontSize:'1.2rem', letterSpacing:'2px' }}>
                  {'★'.repeat(Math.round(rating.average || 0))}{'☆'.repeat(5 - Math.round(rating.average || 0))}
                </span>
                <span style={{ marginLeft:'0.5rem' }}>{rating.average?.toFixed(1) || '—'} · {rating.count} avis</span>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.2rem' }}>
              <span style={{ fontSize:'9px', color:'var(--muted)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginRight:'0.3rem' }}>Votre note:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)} onClick={() => rateGuide(n)}
                  style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color: n <= (hoverStar || userRating) ? 'var(--gold)' : 'var(--border)', padding:'0', lineHeight:'1', transition:'color 0.15s' }}>
                  ★
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize:'13px', color:'var(--text)', lineHeight:1.7, fontWeight:300, marginBottom:'1.5rem', textAlign:'center' }}>
            {guide.description}
          </div>

          {guide.specialite && (
            <div style={{ background:'var(--sand)', border:'1px solid var(--border)', borderRadius:'8px', padding:'1rem', marginBottom:'1.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'9px', color:'var(--muted)', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.3rem' }}>Spécialité</div>
              <div style={{ fontSize:'13px', fontWeight:500, color:'var(--copper)' }}>{guide.specialite}</div>
            </div>
          )}

          {activities.length > 0 && (
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--teal)', marginBottom:'0.6rem' }}>Activités proposées</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {activities.slice(0, 5).map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.6rem 0.8rem', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'12px' }}>
                    <span>{CATEGORY_ICON[a.categorie] || '✦'}</span>
                    <span style={{ flex:1, fontWeight:500 }}>{a.titre}</span>
                    <span style={{ color:'var(--copper)', fontWeight:700 }}>{a.prix} MAD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap' }}>
            {guide.instagram && <a className="btn-social btn-insta" href={guide.instagram} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', padding:'10px 20px', fontSize:'11px', flex:1 }}>📸 Instagram</a>}
            {guide.linkedin && <a className="btn-social btn-linkedin" href={guide.linkedin} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', padding:'10px 20px', fontSize:'11px', flex:1 }}>💼 LinkedIn</a>}
            {guide.whatsapp && <a className="btn-social btn-whatsapp" href={`https://wa.me/${guide.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', padding:'10px 20px', fontSize:'11px', flex:1 }}>💬 WhatsApp</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
