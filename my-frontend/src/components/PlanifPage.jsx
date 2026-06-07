import { useState, useEffect } from 'react'
import { API } from '../config.js'

const TYPE_LABELS = { imp:'Villes Impériales', des:'Désert & Sud', cot:'Côte Atlantique', mon:'Montagnes' }

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

const CAT_MAP = {
  imp:['Culture','UNESCO','Histoire','Artisanat','Gastronomie','Musique','Cinéma'],
  des:['Désert','Aventure','Nature'],
  cot:['Mer','Surf','Bien-être','Sport'],
  mon:['Trek','Nature','Aventure'],
}

export default function PlanifPage({ showToast }) {
  const [destinations, setDestinations] = useState([])
  const [activities, setActivities] = useState([])
  const [depart, setDepart] = useState('')
  const [duree, setDuree] = useState('5')
  const [type, setType] = useState('all')
  const [budget, setBudget] = useState('800')
  const [saison, setSaison] = useState('Printemps (Mars–Mai)')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/destinations`).then(r => r.json()),
      fetch(`${API}/activities`).then(r => r.json()),
    ]).then(([dests, acts]) => {
      setDestinations(dests)
      setActivities(acts)
      if (dests.length > 0) setDepart(dests[0].nom)
    }).catch(() => {}).finally(() => setLoadingData(false))
  }, [])

  const generate = () => {
    if (!depart) { showToast('Veuillez sélectionner une ville de départ'); return }
    setLoading(true)
    setResult(null)

    setTimeout(() => {
      setLoading(false)
      const dur = parseInt(duree)
      const budgetPerDay = parseInt(budget)
      const allowedCats = type === 'all' ? null : (CAT_MAP[type] || [])

      const villeActs = activities.filter(a => {
        if (a.prix > budgetPerDay) return false
        if (allowedCats && !allowedCats.includes(a.categorie)) return false
        if (a.ville !== depart && a.destination_slug?.toLowerCase() !== depart?.toLowerCase()) {
          const match = Object.entries({
            'Marrakech':'Marrakech','Fès':'Fès','Chefchaouen':'Chefchaouen',
            'Essaouira':'Essaouira','Ouarzazate':'Ouarzazate','Rabat':'Rabat',
            'Tanger':'Tanger','Merzouga':'Merzouga','Agadir & Côte':'Agadir & Taghazout',
            'Haut Atlas':'Haut Atlas (Imlil/Toubkal)','Vallée Dadès':'Vallée du Dadès',
          }).find(([, v]) => v === depart)
          if (!match || a.ville !== match[0]) return false
        }
        return true
      })

      const shuffled = [...villeActs].sort(() => Math.random() - 0.5)
      const used = new Set()

      let html = `<div class="plan-preview"><h3>✦ Séjour à ${depart} — ${dur} Jours</h3><div class="ai-badge">⚡ Itinéraire personnalisé</div>`

      for (let i = 0; i < dur; i++) {
        const dayAct = shuffled.find(a => !used.has(a.id))
        if (dayAct) used.add(dayAct.id)

        html += `<div class="itin-day"><div class="day-n">${i + 1}</div><div><div class="day-city-n">Jour ${i + 1} — ${depart}</div>`

        if (dayAct) {
          html += `<div class="itin-act"><span class="act-icon">${CATEGORY_ICON[dayAct.categorie] || '✦'}</span><div><strong>${dayAct.titre}</strong><div class="act-desc">${dayAct.description}</div><div class="act-meta">${dayAct.prix} MAD · ${dayAct.categorie}</div></div></div>`
        } else {
          const label = i === 0 ? "Arrivée et installation" : i === dur - 1 ? "Dernier jour — détente" : "Journée libre"
          html += `<div class="day-detail">${label} — profitez de la ville à votre rythme. Budget disponible: ${budgetPerDay} MAD.</div>`
        }

        html += `</div></div>`
      }

      const totalBudget = budgetPerDay * dur
      const usedCount = used.size
      html += `<div class="plan-budget-summary"><strong>💰 Budget total estimé:</strong> ${totalBudget} MAD (${budgetPerDay} MAD × ${dur} jours) · ${usedCount} activités trouvées dans ${depart}</div>`

      const tips = [
        'Emportez des vêtements légers pour la journée et une veste chaude pour les soirées.',
        'Goûtez aux spécialités locales dans chaque ville que vous visitez.',
        'Les marchés traditionnels sont parfaits pour trouver des souvenirs authentiques.',
        'Prévoyez de l\'eau en quantité suffisante, surtout dans les régions désertiques.',
      ]

      html += `<div class="plan-tips"><strong>💡 Conseil :</strong> ${tips[Math.floor(Math.random() * tips.length)]}</div>`
      html += `</div>`

      setResult(html)
      showToast('Votre itinéraire sur mesure est prêt !')
    }, 800)
  }

  if (loadingData) {
    return (
      <div className="sec" style={{ textAlign:'center', paddingTop:'4rem' }}>
        <div className="plan-spinner" style={{ margin:'0 auto' }}></div>
        <p style={{ color:'rgba(255,255,255,0.5)', marginTop:'1.5rem', fontSize:'0.85rem' }}>Chargement des destinations…</p>
      </div>
    )
  }

  return (
    <div className="sec">
      <div className="sec-title">Planificateur IA de Voyage</div>
      <div className="sec-sub">Votre itinéraire personnalisé généré par intelligence artificielle</div>
      <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>
      <div className="plan-grid">
        <div className="plan-box">
          <label className="plan-label">Ville de destination</label>
          <select className="plan-sel" value={depart} onChange={e => setDepart(e.target.value)}>
            {destinations.map(d => <option key={d.id} value={d.nom}>{d.nom}</option>)}
          </select>

          <label className="plan-label">Durée du séjour</label>
          <select className="plan-sel" value={duree} onChange={e => setDuree(e.target.value)}>
            {[3,5,7,10,14].map(n => <option key={n} value={n}>{n} jours</option>)}
          </select>

          <label className="plan-label">Type de voyage</label>
          <select className="plan-sel" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Tous types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <label className="plan-label">Budget (MAD/jour)</label>
          <input className="plan-inp" type="number" value={budget} onChange={e => setBudget(e.target.value)} min="200" max="5000" />

          <label className="plan-label">Saison de voyage</label>
          <select className="plan-sel" value={saison} onChange={e => setSaison(e.target.value)}>
            {['Printemps (Mars–Mai)','Été (Juin–Août)','Automne (Sep–Nov)','Hiver (Déc–Fév)'].map(v => <option key={v}>{v}</option>)}
          </select>

          <label className="plan-label">Notes & préférences</label>
          <textarea className="plan-ta" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enfants, mobilité réduite, végétarien, intérêts particuliers…"></textarea>

          <button className="btn-plan" onClick={generate} disabled={loading}>
            {loading ? 'Génération…' : "✦ Générer mon itinéraire avec l'IA"}
          </button>
        </div>
        <div className="plan-box">
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'300px', textAlign:'center' }}>
              <div className="plan-spinner"></div>
              <p style={{ color:'var(--copper)', fontFamily:"'DM Sans',sans-serif", fontSize:'0.8rem', fontWeight:600, letterSpacing:'0.08em', marginTop:'1.5rem', textTransform:'uppercase' }}>Génération en cours…</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginTop:'0.4rem', fontStyle:'italic' }}>L'IA prépare votre itinéraire sur mesure</p>
            </div>
          ) : result ? (
            <div>
              <div dangerouslySetInnerHTML={{ __html: result }} />
              <button className="btn-plan-new" onClick={() => setResult(null)}>Créer un nouvel itinéraire</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'300px', textAlign:'center', opacity:0.6 }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1.2rem' }}>🗺️</div>
              <p style={{ fontSize:'0.9rem', fontStyle:'italic', lineHeight:1.6, color:'rgba(255,255,255,0.7)' }}>
                Remplissez le formulaire et cliquez sur<br />
                <strong style={{ color:'var(--copper)' }}>Générer mon itinéraire</strong><br />
                pour obtenir un circuit personnalisé par notre IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
