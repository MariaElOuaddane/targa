import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API = 'http://localhost:3001/api'

const TYPE_COLORS = { imp: '#B5451B', des: '#D4A843', cot: '#2E6B6B', mon: '#6B7B3A' }
const TYPE_LABELS = { imp: 'Ville impériale', des: 'Désert & Sud', cot: 'Côte atlantique', mon: 'Montagnes' }

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

export default function MapPage({ goPage, showToast, isActive }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const userMarker = useRef(null)
  const markersRef = useRef([])
  const destsRef = useRef([])
  const [destinations, setDestinations] = useState([])
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/destinations`).then(r => r.json()),
      fetch(`${API}/activities`).then(r => r.json()),
    ])
      .then(([dests, acts]) => {
        setDestinations(dests)
        destsRef.current = dests
        setActivities(acts)
        setLoading(false)
      })
      .catch(() => {
        showToast('Erreur chargement des données')
        setLoading(false)
      })
  }, [showToast])

  useEffect(() => {
    if (!isActive || loading || destinations.length === 0 || mapInstance.current) return

    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([31.7, -6.5], 5.5)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)

    const group = L.layerGroup().addTo(map)

    destinations.forEach(v => {
      const color = TYPE_COLORS[v.type_touristique] || '#B5451B'
      const html = `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`
      const m = L.marker([v.latitude, v.longitude], {
        icon: L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
      })
      m.bindPopup(
        `<div class="pp-title">${v.icone || '🗺️'} ${v.nom}</div>` +
        `<div class="pp-sub">${v.region}</div>` +
        `<button class="pp-btn" onclick="window.__openCity('${v.slug}')">Découvrir ✦</button>`
      )
      group.addLayer(m)
    })

    window.__openCity = (slug) => {
      const v = destsRef.current.find(x => x.slug === slug)
      if (v) {
        setSelected(v)
        map.flyTo([v.latitude, v.longitude], 8, { duration: 1.2 })
      }
    }

    mapInstance.current = map
    markersRef.current = group

    return () => { map.remove(); mapInstance.current = null }
  }, [isActive, loading, destinations])

  const locateMe = () => {
    if (!navigator.geolocation) { showToast('Géolocalisation non supportée'); return }
    showToast('Recherche de votre position...')
    navigator.geolocation.getCurrentPosition((p) => {
      const map = mapInstance.current
      if (!map) return
      const { latitude: lat, longitude: lng } = p.coords
      if (userMarker.current) map.removeLayer(userMarker.current)
      userMarker.current = L.marker([lat, lng], {
        icon: L.divIcon({
          html: '<div style="background-color:#7B3A7B;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #7B3A7B;"></div>',
          className: '', iconSize: [16, 16], iconAnchor: [8, 8]
        })
      }).addTo(map)
      userMarker.current.bindPopup('<b>Vous êtes ici</b><br>Bienvenue au Maroc !').openPopup()
      map.flyTo([lat, lng], 7, { duration: 1.5 })
    }, () => showToast('Impossible d\'accéder à votre position'))
  }

  const resetView = () => {
    const map = mapInstance.current
    if (map) { map.flyTo([31.7, -6.5], 5.5, { duration: 1.2 }); setSelected(null) }
  }

  const destActs = selected
    ? activities.filter(a => a.destination_slug === selected.slug)
    : []

  const destSlugToGuideVille = {
    marrakech: 'Marrakech', fes: 'Fès', merzouga: 'Merzouga',
    agadir: 'Agadir & Taghazout', atlas: 'Haut Atlas',
    chefchaouen: 'Chefchaouen', essaouira: 'Essaouira',
    ouarzazate: 'Ouarzazate', rabat: 'Rabat',
    tanger: 'Tanger', dades: 'Vallée du Dadès',
  }

  return (
    <>
      <div className="zellij"></div>
      <div className="sec">
        <div className="sec-title">Carte Interactive du Maroc</div>
        <div className="sec-sub">Cliquez sur une ville pour découvrir ses richesses — Géolocalisation en temps réel</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>
        <div className="map-toolbar">
          <button className="btn-map btn-locate" onClick={locateMe}>📍 Me localiser</button>
          <button className="btn-map btn-reset" onClick={resetView}>🗺️ Vue Maroc</button>
        </div>
        <div className="map-wrap">
          <div>
            <div className="map-frame" ref={mapRef} style={{ height: 580 }}></div>
            {loading && <div style={{ textAlign:'center', padding:'1rem', color:'var(--muted)' }}>Chargement de la carte…</div>}
            <div className="map-legend">
              <div className="leg-item"><div className="leg-dot" style={{ background: '#B5451B' }}></div>Villes impériales</div>
              <div className="leg-item"><div className="leg-dot" style={{ background: '#D4A843' }}></div>Désert & Sud</div>
              <div className="leg-item"><div className="leg-dot" style={{ background: '#2E6B6B' }}></div>Côte atlantique</div>
              <div className="leg-item"><div className="leg-dot" style={{ background: '#6B7B3A' }}></div>Montagnes</div>
              <div className="leg-item"><div className="leg-dot" style={{ background: '#7B3A7B' }}></div>Votre position</div>
            </div>
          </div>
          <div>
            {!selected ? (
              <div className="city-panel" style={{ display: 'block' }}>
                <div className="city-panel-placeholder">
                  <div className="ph-icon">🗺️</div>
                  <p>Cliquez sur un marqueur pour découvrir les détails de la ville, ses activités incontournables et les lieux à visiter.</p>
                </div>
              </div>
            ) : (
              <div className="city-panel open" style={{ display: 'block' }}>
                <div className="city-panel-hero">{selected.icone || '🗺️'}</div>
                <div className="city-panel-body">
                  <div className="city-name-big">{selected.nom}</div>
                  <div className="city-region">{selected.region}</div>
                  <div className="city-tags">
                    <span className="city-tag">{TYPE_LABELS[selected.type_touristique] || selected.type_touristique}</span>
                  </div>

                  {selected.description && (
                    <div className="city-desc" style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:'0.8rem', lineHeight:1.5 }}>
                      {selected.description}
                    </div>
                  )}

                  <div className="city-info-grid">
                    {selected.climat && (
                      <div className="city-info-item">
                        <span className="city-info-icon">☀️</span>
                        <span className="city-info-val">{selected.climat.split('·')[0]}</span>
                        <span className="city-info-key">Climat</span>
                      </div>
                    )}
                    {selected.hebergement && (
                      <div className="city-info-item">
                        <span className="city-info-icon">🏨</span>
                        <span className="city-info-val">{selected.hebergement.split(',')[0]}</span>
                        <span className="city-info-key">Logement</span>
                      </div>
                    )}
                  </div>

                  <div className="city-acts-title">Activités ({destActs.length})</div>
                  <div className="city-act-list">
                    {destActs.length === 0 ? (
                      <div style={{ fontSize:'0.75rem', color:'var(--muted)', fontStyle:'italic' }}>Aucune activité disponible</div>
                    ) : (
                      destActs.slice(0, 5).map(a => (
                        <div className="city-act-item" key={a.id}>
                          <span className="act-ico">{CATEGORY_ICON[a.categorie] || '✦'}</span>
                          {a.titre}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="city-actions" style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'1rem' }}>
                    <button className="btn-hero btn-hero-primary" style={{ width:'100%' }}
                      onClick={() => goPage('activites', selected.slug)}>
                      🎯 Activités à {selected.nom}
                    </button>
                    <button className="btn-hero btn-hero-primary" style={{ width:'100%' }}
                      onClick={() => goPage('guides', destSlugToGuideVille[selected.slug] || selected.nom)}>
                      👥 Guides à {selected.nom}
                    </button>
                    <button className="btn-hero btn-hero-primary" style={{ width:'100%' }}
                      onClick={() => goPage('avis', selected.nom)}>
                      💬 Avis sur {selected.nom}
                    </button>
                    <button className="btn-hero btn-hero-primary" style={{ width:'100%' }}
                      onClick={() => goPage('destination', selected.slug)}>
                      ✦ Page détaillée
                    </button>
                  </div>
                </div>
                <button className="city-close" onClick={() => setSelected(null)}>Fermer les détails</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="zellij"></div>
    </>
  )
}
