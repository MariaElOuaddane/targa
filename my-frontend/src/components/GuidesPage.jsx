import { useState, useEffect } from 'react'
import GuideDetail from './GuideDetail'
import { API } from '../config.js'

export default function GuidesPage({ showToast, destSlug }) {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API}/guides`)
      .then(r => r.json())
      .then(data => setGuides(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = destSlug
    ? guides.filter(g => g.ville && g.ville.toLowerCase() === destSlug.toLowerCase())
    : guides

  return (
    <>
      <div className="sec">
        <div className="sec-title">Guides Locaux Certifiés</div>
        <div className="sec-sub">Des experts passionnés — Contactez-les directement par appel ou message</div>
        <div className="divider"><div className="divider-star">✦ ✦ ✦</div></div>
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--muted)' }}>Chargement des guides…</div>
        ) : (
          <div className="guides-grid">
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--muted)', fontStyle:'italic' }}>
                {destSlug ? `Aucun guide disponible pour ${destSlug}` : 'Aucun guide disponible'}
              </div>
            ) : filtered.map(g => (
              <div className="guide-card" key={g.id} onClick={() => setSelected(g)}>
                <div className="gc-header">
                  <div className="guide-avatar">{'👤'}</div>
                  <div className="gc-name">{g.prenom} {g.nom}</div>
                  <div className="gc-spec">{g.ville} · Guide certifié{g.nom?.endsWith('e') ? 'e' : ''}</div>
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

      {selected && (
        <GuideDetail
          guide={selected}
          onClose={() => setSelected(null)}
          showToast={showToast}
        />
      )}
    </>
  )
}
