import { useState, useEffect, useMemo } from 'react'
import ActivityDetail from './ActivityDetail'

const API = 'http://localhost:3001/api'

const PRICE_RANGES = [
  { key: 'all', label: 'Tous les prix' },
  { key: '0-200', label: '< 200 MAD' },
  { key: '200-500', label: '200 - 500 MAD' },
  { key: '500-1000', label: '500 - 1000 MAD' },
  { key: '1000+', label: '> 1000 MAD' },
]

function StarDisplay({ avg, size }) {
  return <span className="act-stars" style={{fontSize:size||12}}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5-Math.round(avg))}</span>
}

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

const SLUG_TO_VILLE = {
  marrakech: 'Marrakech', fes: 'Fès', merzouga: 'Merzouga',
  agadir: 'Agadir & Côte', atlas: 'Haut Atlas',
  chefchaouen: 'Chefchaouen', essaouira: 'Essaouira',
  ouarzazate: 'Ouarzazate', rabat: 'Rabat',
  tanger: 'Tanger', dades: 'Vallée Dadès',
}

export default function ActivitiesPage({ goPage, showToast, destSlug }) {
  const [activities, setActivities] = useState([])
  const [destFilter, setDestFilter] = useState(
    destSlug ? (SLUG_TO_VILLE[destSlug] || 'all') : 'all'
  )
  const [catFilter, setCatFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API}/activities`)
      .then(r => r.json())
      .then(setActivities)
      .catch(() => showToast('Erreur chargement des activités'))
  }, [showToast])

  const destinations = useMemo(() => {
    const set = new Set(activities.map(a => a.ville).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [activities])

  const categories = useMemo(() => {
    const set = new Set(activities.map(a => a.categorie).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [activities])

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (destFilter !== 'all' && a.ville !== destFilter) return false
      if (catFilter !== 'all' && a.categorie !== catFilter) return false
      if (priceFilter !== 'all') {
        if (priceFilter === '0-200' && (a.prix < 0 || a.prix > 200)) return false
        if (priceFilter === '200-500' && (a.prix < 200 || a.prix > 500)) return false
        if (priceFilter === '500-1000' && (a.prix < 500 || a.prix > 1000)) return false
        if (priceFilter === '1000+' && a.prix < 1000) return false
      }
      return true
    })
  }, [activities, destFilter, catFilter, priceFilter])

  return (
    <>
      <div className="sec">
        <div className="sec-title">Catalogue d'Activités</div>
        <div className="sec-sub">Filtrez par destination, catégorie ou budget</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>

        <div className="flt-row-3">
          <div className="flt-wrap">
            <label className="flt-label">Destination</label>
            <select className="flt-select" value={destFilter} onChange={e => setDestFilter(e.target.value)}>
              {destinations.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'Toutes les destinations' : d}</option>
              ))}
            </select>
          </div>
          <div className="flt-wrap">
            <label className="flt-label">Catégorie</label>
            <select className="flt-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'Toutes les catégories' : c}</option>
              ))}
            </select>
          </div>
          <div className="flt-wrap">
            <label className="flt-label">Budget</label>
            <select className="flt-select" value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
              {PRICE_RANGES.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {activities.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--muted)' }}>Chargement des activités…</div>
        ) : (
          <div className="acts-grid">
            {filtered.map((a) => (
              <div className="act-card" key={a.id} onClick={() => setSelected(a)}>
                <div className="act-img">{CATEGORY_ICON[a.categorie] || '✦'}</div>
                <div className="act-body">
                  <div className="act-badges">
                    <span className="act-tag">{a.categorie}</span>
                    <span className="act-city-tag">{a.ville}</span>
                  </div>
                  <h3>{a.titre}</h3>
                  <p>{a.description}</p>
                  <div className="act-meta">
                    <span className="act-price">{a.prix} MAD</span>
                    <StarDisplay avg={a.note} />
                  </div>
                </div>
                <div className="act-card-footer">
                  <span className="act-detail-btn">Voir détails ✦</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ActivityDetail
          activity={selected}
          onClose={() => setSelected(null)}
          showToast={showToast}
        />
      )}
    </>
  )
}
