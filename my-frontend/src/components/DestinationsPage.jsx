import { useState, useEffect } from 'react'
import { API } from '../config.js'

const TYPE_ORDER = ['Ville impériale', 'Désert & Sud', 'Côte atlantique', 'Montagnes']
const TYPE_ICONS = { 'Ville impériale': '🏛️', 'Désert & Sud': '🐪', 'Côte atlantique': '🌊', 'Montagnes': '🏔️' }

const DEST_IMAGES = {
  marrakech: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=700&q=80',
  fes: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=700&q=80',
  merzouga: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80',
  agadir: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=700&q=80',
  atlas: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=700&q=80',
  chefchaouen: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=700&q=80',
  essaouira: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=80',
  ouarzazate: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700&q=80',
  rabat: 'https://images.unsplash.com/photo-1704738795093-5d8f864f4330?w=700&q=80',
  tanger: 'https://images.pexels.com/photos/10205082/pexels-photo-10205082.jpeg?auto=compress&cs=tinysrgb&w=700',
  dades: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=700&q=80',
}

export default function DestinationsPage({ goPage }) {
  const [destinations, setDestinations] = useState([])
  const [activeType, setActiveType] = useState('all')

  useEffect(() => {
    fetch(`${API}/destinations`)
      .then(r => r.json())
      .then(data => setDestinations(data))
      .catch(() => {})
  }, [])

  const TYPE_MAP = {
    imp: 'Ville impériale', des: 'Désert & Sud',
    cot: 'Côte atlantique', mon: 'Montagnes',
  }

  const grouped = {}
  destinations.forEach(d => {
    const cat = TYPE_MAP[d.type_touristique] || 'Autre'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(d)
  })

  const filteredTypes = activeType === 'all'
    ? TYPE_ORDER
    : [activeType]

  return (
    <>
      <div className="zellij"></div>
      <div className="sec">
        <div className="sec-title">Destinations du Maroc</div>
        <div className="sec-sub">Explorez chaque région et découvrez ses trésors cachés</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        <div className="dest-filters">
          <button className={`filter-btn ${activeType === 'all' ? 'active' : ''}`} onClick={() => setActiveType('all')}>Toutes</button>
          {TYPE_ORDER.map(t => (
            <button key={t} className={`filter-btn ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
              {TYPE_ICONS[t]} {t}
            </button>
          ))}
        </div>

        {destinations.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--muted)' }}>Chargement des destinations…</div>
        ) : (
          filteredTypes.map(cat => {
            const items = grouped[cat] || []
            if (items.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom:'40px' }}>
                <div className="dest-cat-header">
                  <span className="dest-cat-icon">{TYPE_ICONS[cat]}</span>
                  <h2 className="dest-cat-title">{cat}</h2>
                  <span className="dest-cat-count">{items.length} destination{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="dest-grid" style={{ marginBottom:0 }}>
                  {items.map(d => (
                    <div className="dest-card" key={d.id} onClick={() => goPage('destination', d.slug)}>
                      <div className="dc-img">
                        <img src={DEST_IMAGES[d.slug] || 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=700&q=80'} alt={d.nom} loading="lazy" />
                        <div className="dc-overlay"></div>
                        <div className="dc-cat">{TYPE_MAP[d.type_touristique]}</div>
                      </div>
                      <div className="dc-body">
                        <div className="dc-name">{d.nom}</div>
                        <div className="dc-sub">{d.region}</div>
                        <div className="dc-desc">{d.description}</div>
                        <div className="dc-footer">
                          <span style={{ fontSize:'10px', color:'var(--muted)' }}>{d.climat?.split('·')[0]?.trim() || d.climat}</span>
                          <span className="dest-detail-link">Découvrir ✦</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="zellij"></div>
    </>
  )
}