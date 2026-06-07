import { useState, useEffect } from 'react'

const HERO_SLIDES = [
  {bg:'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1400&q=90',city:'Marrakech',sub:'La Ville Rouge'},
  {bg:'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=1400&q=90',city:'Chefchaouen',sub:'La Perle Bleue'},
  {bg:'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1400&q=90',city:'Sahara',sub:"L'Infini Doré"},
  {bg:'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=1400&q=90',city:'Fès',sub:'Capitale Spirituelle'},
]

const THEMES = [
  {id:'surf',icon:'🏄',name:'Surfeur',desc:'Vagues et alizés',img:'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&q=80'},
  {id:'mountain',icon:'🏔️',name:'Montagnard',desc:'Sommets et cèdres',img:'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=400&q=80'},
  {id:'culture',icon:'🏛️',name:'Culturel',desc:'Médinas & histoire',img:'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80'},
  {id:'adventure',icon:'🐪',name:'Aventurier',desc:'Désert & adrénaline',img:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80'},
  {id:'wellness',icon:'♨️',name:'Bien-être',desc:'Hammam & riad',img:'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80'},
  {id:'desert',icon:'🌅',name:'Nomade',desc:'Sable et étoiles',img:'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&q=80'},
  {id:'foodie',icon:'🍲',name:'Gastronome',desc:'Saveurs du Maroc',img:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80'},
  {id:'sport',icon:'🏍️',name:'Sportif',desc:'Action & dépassement',img:'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=400&q=80'},
]

const DESTINATIONS = [
  {id:1,name:'Marrakech',subtitle:'La Ville Rouge',slug:'marrakech',cat:'Ville impériale',img:'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=700&q=80',rating:4.9,reviews:1240,price:890,desc:'Médina millénaire, souks animés, jardins Majorelle'},
  {id:2,name:'Chefchaouen',subtitle:'La Perle Bleue',slug:'chefchaouen',cat:'Montagne',img:'https://images.unsplash.com/photo-1548013146-72479768bada?w=700&q=80',rating:4.8,reviews:876,price:670,desc:'Ruelles bleues nichées dans les montagnes du Rif'},
  {id:3,name:'Merzouga',subtitle:'Dunes du Sahara',slug:'merzouga',cat:'Désert',img:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80',rating:4.9,reviews:2103,price:1200,desc:'Nuit sous les étoiles, dromadaire au coucher du soleil'},
  {id:4,name:'Fès',subtitle:'Capitale Spirituelle',slug:'fes',cat:'Ville impériale',img:'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=700&q=80',rating:4.7,reviews:934,price:750,desc:'Médina UNESCO, tanneries, medersas'},
  {id:5,name:'Essaouira',subtitle:'Cité des Vents',slug:'essaouira',cat:'Côtier',img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=80',rating:4.6,reviews:654,price:950,desc:'Remparts, kitesurf, port de pêche'},
  {id:6,name:'Agadir',subtitle:'Côte Atlantique',slug:'agadir',cat:'Côtier',img:'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=700&q=80',rating:4.4,reviews:512,price:1100,desc:'Plages, soleil 300 jours par an'},
]

function Stars({ n, size }) {
  return <span className="sc-stars" style={{fontSize:size||12}}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5-Math.round(n))}</span>
}

export default function Accueil({ goPage }) {
  const [slideIdx, setSlideIdx] = useState(0)
  const [destFilter, setDestFilter] = useState('all')

  useEffect(() => {
    const interval = setInterval(() => setSlideIdx(i => (i + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredDests = destFilter === 'all' ? DESTINATIONS : DESTINATIONS.filter(d => d.cat === destFilter)

  return (
    <>
      {/* ═══ HERO ═══ */}
      <div className="hero">
        <div className="hero-slides">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className={`hero-slide ${i === slideIdx ? 'active' : ''}`} style={{ backgroundImage: `url(${s.bg})` }}></div>
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-eyebrow">✦ VOYAGEZ AUTREMENT ✦</div>
          <h1 className="hero-title">Découvrez le Maroc <em>authentique</em></h1>
          <p className="hero-sub">Carte interactive, activités locales, guides certifiés et planificateur de voyage sur mesure</p>

          <div className="hero-btns">
            <button className="btn-hero btn-hero-primary" onClick={() => goPage('carte')}>🗺️ Explorer la carte</button>
            <button className="btn-hero btn-hero-secondary" onClick={() => goPage('planif')}>✦ Planifier</button>
          </div>
        </div>

        <div className="slide-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={`dot ${i === slideIdx ? 'active' : ''}`} onClick={() => setSlideIdx(i)}></button>
          ))}
        </div>

        <div className="hero-stats">
          <div className="stat"><div className="stat-num">22</div><div className="stat-lbl">Destinations</div></div>
          <div className="stat"><div className="stat-num">40+</div><div className="stat-lbl">Activités</div></div>
          <div className="stat"><div className="stat-num">8</div><div className="stat-lbl">Guides certifiés</div></div>
        </div>
      </div>

      {/* ═══ THEMES ═══ */}
      <div className="section" style={{ background: 'var(--sand)' }}>
        <div className="section-header">
          <span className="eyebrow">✦ Trouvez votre style ✦</span>
          <div className="sec-title">Voyagez selon <em>vos envies</em></div>
          <div className="divider-line" style={{ width:60, height:2.5, background:'linear-gradient(90deg,var(--gold),var(--copper2))', margin:'14px auto 0', borderRadius:2 }}></div>
        </div>
        <div className="themes-grid">
          {THEMES.map(t => (
            <div className="theme-card" key={t.id} onClick={() => goPage('activites')}>
              <div className="theme-img">
                <img src={t.img} alt={t.name} loading="lazy" />
                <div className="theme-overlay"></div>
                <div className="theme-icon">{t.icon}</div>
              </div>
              <div className="theme-body">
                <div className="theme-name">{t.name}</div>
                <div className="theme-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS BANNER ═══ */}
      <div className="stats-banner">
        <div className="stat-big"><div className="num">22+</div><div className="lbl">Destinations</div></div>
        <div className="stat-sep"></div>
        <div className="stat-big"><div className="num">40+</div><div className="lbl">Activités</div></div>
        <div className="stat-sep"></div>
        <div className="stat-big"><div className="num">8</div><div className="lbl">Guides certifiés</div></div>
        <div className="stat-sep"></div>
        <div className="stat-big"><div className="num">98%</div><div className="lbl">Satisfaction</div></div>
      </div>

      {/* ═══ DESTINATIONS ═══ */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="section-header">
          <span className="eyebrow">✦ Explorez le Maroc ✦</span>
          <div className="sec-title">Destinations <em>phares</em></div>
        </div>
        <div className="dest-filters">
          {['all','Ville impériale','Montagne','Désert','Côtier'].map(f => (
            <button key={f} className={`filter-btn ${destFilter === f ? 'active' : ''}`} onClick={() => setDestFilter(f)}>
              {f === 'all' ? 'Toutes' : f}
            </button>
          ))}
        </div>
        <div className="dest-grid">
          {filteredDests.map(d => (
            <div className="dest-card" key={d.id} onClick={() => goPage('destination', d.slug)}>
              <div className="dc-img">
                <img src={d.img} alt={d.name} loading="lazy" />
                <div className="dc-overlay"></div>
                <div className="dc-cat">{d.cat}</div>
                <div className="dc-price">À partir de {d.price} DH</div>
                <div className="dc-rating-pill"><Stars n={d.rating} size={10} /> {d.rating}</div>
              </div>
              <div className="dc-body">
                <div className="dc-name">{d.name}</div>
                <div className="dc-sub">{d.subtitle}</div>
                <div className="dc-desc">{d.desc}</div>
                <div className="dc-footer">
                  <span style={{ fontSize:'10px', color:'var(--muted)' }}>{d.reviews} avis</span>
                  <span className="rating-badge">{d.rating} ★</span>
                </div>
              </div>
            </div>
          ))}
          <div className="dest-card see-all" onClick={() => goPage('destinations')}>
            <div className="see-all-content">
              <span className="see-all-icon">✦</span>
              <span className="see-all-text">Toutes les destinations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer>
        <div className="footer-top">
          <div>
            <div className="logo-wrap" style={{ marginBottom:'16px' }}>
              <div className="logo-arch"></div>
              <div className="logo-text">
                <span className="logo-name">TARGA</span>
                <span className="logo-sub">Travelling Morocco</span>
              </div>
            </div>
            <div className="footer-tagline">Votre passerelle vers un Maroc authentique — entre tradition et modernité.</div>
            <div className="social-row" style={{ display:'flex', gap:'10px' }}>
              {['📘','📷','🐦','▶️'].map((s,i) => (
                <div key={i} className="soc-btn" style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.06)' }}>{s}</div>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h4>Explorer</h4>
            <span className="footer-link" onClick={() => goPage('destinations')}>Destinations</span>
            <span className="footer-link" onClick={() => goPage('carte')}>Carte</span>
            <span className="footer-link" onClick={() => goPage('activites')}>Activités</span>
            <span className="footer-link" onClick={() => goPage('guides')}>Guides</span>
            <span className="footer-link" onClick={() => goPage('planif')}>Planificateur</span>
          </div>
          <div className="footer-col">
            <h4>Communauté</h4>
            <span className="footer-link" onClick={() => goPage('avis')}>Avis</span>
            <span className="footer-link" onClick={() => goPage('login')}>Connexion</span>
            <span className="footer-link" onClick={() => goPage('signup')}>Inscription</span>
          </div>
          <div className="footer-col">
            <h4>Légal</h4>
            <span className="footer-link">CGV</span>
            <span className="footer-link">Confidentialité</span>
            <span className="footer-link">Mentions légales</span>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 TARGA — Travelling Morocco</div>
          <div className="footer-copy">✦ Made with ❤️ for Morocco ✦</div>
        </div>
      </footer>
    </>
  )
}
