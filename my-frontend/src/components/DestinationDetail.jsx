import { useState, useEffect } from 'react'
import { API } from '../config.js'

const DEST_IMAGES = {
  marrakech: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80',
  fes: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=1200&q=80',
  merzouga: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80',
  agadir: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=1200&q=80',
  atlas: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=1200&q=80',
  chefchaouen: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80',
  essaouira: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80',
  ouarzazate: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80',
  rabat: 'https://images.unsplash.com/photo-1704738795093-5d8f864f4330?w=1200&q=80',
  tanger: 'https://images.pexels.com/photos/10205082/pexels-photo-10205082.jpeg?auto=compress&cs=tinysrgb&w=1200',
  dades: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=80',
}

function Stars({ n, size }) {
  return <span className="sc-stars" style={{fontSize:size||12}}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5-Math.round(n))}</span>
}

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

export default function DestinationDetail({ goPage, showToast, slug }) {
  const [dest, setDest] = useState(null)
  const [activities, setActivities] = useState([])
  const [guides, setGuides] = useState([])
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(null)
  const [loading, setLoading] = useState(true)

  const SLUG_TO_GUIDE_VILLE = {
    marrakech: 'Marrakech', fes: 'Fès', merzouga: 'Merzouga',
    agadir: 'Agadir & Taghazout', atlas: 'Haut Atlas',
    chefchaouen: 'Chefchaouen', essaouira: 'Essaouira',
    ouarzazate: 'Ouarzazate', rabat: 'Rabat',
    tanger: 'Tanger', dades: 'Vallée du Dadès',
  }

  useEffect(() => {
    if (!slug) return
    const destFetch = fetch(`${API}/destinations/${slug}`).then(r => r.json())
    const actFetch = fetch(`${API}/activities?destination_slug=${slug}`).then(r => r.json())
    const guideFetch = fetch(`${API}/guides`).then(r => r.json())
    const revFetch = fetch(`${API}/evaluations`).then(r => r.json())

    Promise.all([destFetch, actFetch, guideFetch, revFetch])
      .then(([d, acts, gs, revs]) => {
        setDest(d)
        setActivities(acts)
        const guideVille = SLUG_TO_GUIDE_VILLE[slug]
        setGuides(guideVille ? gs.filter(g => g.ville && g.ville.toLowerCase() === guideVille.toLowerCase()) : [])
        const filtered = revs.filter(r =>
          r.destination && d.nom && r.destination.toLowerCase() === d.nom.toLowerCase()
        )
        setReviews(filtered)

        fetch(`${API}/ratings/destination/${d.id}`)
          .then(r => r.json())
          .then(r => setRating(r))
          .catch(() => {})

        setLoading(false)
      })
      .catch(() => { setLoading(false); showToast('Erreur chargement destination') })
  }, [slug, showToast])

  if (!slug) {
    return (
      <div className="sec" style={{ textAlign:'center', padding:'4rem' }}>
        <p style={{ color:'var(--muted)' }}>Aucune destination sélectionnée.</p>
        <button className="btn-hero btn-hero-primary" style={{ marginTop:'1rem' }} onClick={() => goPage('destinations')}>
          Voir les destinations
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="sec" style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="plan-spinner"></div>
      </div>
    )
  }

  if (!dest) {
    return (
      <div className="sec" style={{ textAlign:'center', padding:'4rem' }}>
        <p style={{ color:'var(--muted)' }}>Destination introuvable.</p>
        <button className="btn-hero btn-hero-primary" style={{ marginTop:'1rem' }} onClick={() => goPage('destinations')}>
          Retour aux destinations
        </button>
      </div>
    )
  }

  const TYPE_MAP = {
    imp: 'Ville impériale', des: 'Désert & Sud',
    cot: 'Côte atlantique', mon: 'Montagnes',
  }

  return (
    <>
      <div className="dest-detail-hero">
        <div className="dest-detail-bg" style={{ backgroundImage: `url(${DEST_IMAGES[slug]})` }}>
          <div className="ddh-icon">{dest.icone || '🗺️'}</div>
        </div>
        <div className="dest-detail-overlay"></div>
        <div className="dest-detail-hero-content">
          <span className="ddh-type">{TYPE_MAP[dest.type_touristique] || dest.type_touristique}</span>
          <h1 className="ddh-title">{dest.nom}</h1>
          <p className="ddh-region">{dest.region}</p>
          <div className="ddh-meta">
            {rating && (
              <span className="ddh-rating">
                <Stars n={rating.average} size={14} />
                <span style={{ marginLeft:'6px', fontWeight:600 }}>{rating.average}</span>
                <span style={{ marginLeft:'4px', opacity:0.6 }}>({rating.count})</span>
              </span>
            )}
          </div>
          <div className="ddh-actions">
            <button className="btn-hero btn-hero-primary" onClick={() => goPage('activites')}>Voir toutes les activités</button>
            <button className="btn-hero btn-hero-secondary" onClick={() => goPage('carte')}>Voir sur la carte</button>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="dd-description">
          <h3 className="dd-section-title">À propos</h3>
          <p>{dest.description}</p>
          {dest.climat && <div className="dd-info-row"><span>☀️ Climat</span><span>{dest.climat}</span></div>}
          {dest.hebergement && <div className="dd-info-row"><span>🏨 Hébergement</span><span>{dest.hebergement}</span></div>}
        </div>

        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        {/* Activities */}
        <div className="dd-section">
          <h3 className="dd-section-title">
            <span>Activités à {dest.nom}</span>
            <span className="dd-count-badge">{activities.length}</span>
          </h3>
          {activities.length === 0 ? (
            <p style={{ color:'var(--muted)', fontStyle:'italic' }}>Aucune activité disponible pour cette destination.</p>
          ) : (
            <div className="acts-grid">
              {activities.map(a => (
                <div className="act-card" key={a.id}>
                  <div className="ac-img" style={{ background:'linear-gradient(135deg,var(--night2),var(--night3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>
                    {CATEGORY_ICON[a.categorie] || '✦'}
                  </div>
                  <div className="act-body">
                    <div className="act-badges">
                      <span className="act-tag">{a.categorie}</span>
                    </div>
                    <h3>{a.titre}</h3>
                    <p>{a.description}</p>
                    <div className="act-meta">
                      <span className="act-price">{a.prix} MAD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        {/* Guides */}
        <div className="dd-section">
          <h3 className="dd-section-title">
            <span>Guides à {dest.nom}</span>
            <span className="dd-count-badge">{guides.length}</span>
          </h3>
          {guides.length === 0 ? (
            <p style={{ color:'var(--muted)', fontStyle:'italic' }}>Aucun guide disponible pour cette destination.</p>
          ) : (
            <div className="guides-grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))' }}>
              {guides.map(g => (
                <div className="guide-card" key={g.id} style={{ cursor:'default' }}>
                  <div className="gc-header">
                    <div className="guide-avatar">{'👤'}</div>
                    <div className="gc-name">{g.prenom} {g.nom}</div>
                    <div className="gc-spec">{g.ville} · Guide certifié</div>
                  </div>
                  <div className="gc-body">
                    {g.langues && (
                      <div className="guide-langs">
                        {g.langues.split(',').map((l, i) => (
                          <span className="lang-b" key={i}>{l.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="guide-desc">{g.description}</div>
                    <div className="guide-contact">
                      {g.instagram && <a className="btn-social btn-insta" href={g.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>📸 Instagram</a>}
                      {g.linkedin && <a className="btn-social btn-linkedin" href={g.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>💼 LinkedIn</a>}
                      {g.whatsapp && <a className="btn-social btn-whatsapp" href={`https://wa.me/${g.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>💬 WhatsApp</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        {/* Reviews */}
        <div className="dd-section">
          <div className="dd-reviews-header">
            <h3 className="dd-section-title">
              <span>Avis des voyageurs</span>
              <span className="dd-count-badge">{reviews.length}</span>
            </h3>
          </div>
          {reviews.length === 0 ? (
            <p style={{ color:'var(--muted)', fontStyle:'italic' }}>Aucun avis pour cette destination pour le moment.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map(r => (
                <div className="review-card" key={r.id}>
                  <div className="review-header">
                      <div className="review-meta">
                      <div className="review-author">{r.auteur_prenom} {r.auteur_nom}</div>
                    </div>
                  </div>
                  <div className="review-txt">"{r.commentaire}"</div>
                  <div className="review-date">{new Date(r.created_at).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}