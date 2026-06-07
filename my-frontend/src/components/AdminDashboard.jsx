import { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:3001/api'

const CATEGORY_ICON = {
  Culture:'🏛️', Gastronomie:'🍽️', Nature:'🌿', 'Bien-être':'🧘',
  Histoire:'📜', Artisanat:'🛠️', Désert:'🏜️', Aventure:'🧗',
  Surf:'🏄', Mer:'🌊', Trek:'🥾', Musique:'🎵',
  Sport:'⚽', UNESCO:'🏗️', Cinéma:'🎬',
}

const PAGES = ['dashboard','utilisateurs','guides','reservations','avis','activites','roles','logs']
const PAGE_TITLES = {
  dashboard:'Vue d\'ensemble', utilisateurs:'Gestion des Utilisateurs', guides:'Gestion des Guides',
  reservations:'Réservations', avis:'Avis & Évaluations', roles:'Rôles & Permissions',
  activites:'Gestion des Activités', logs:'Journal d\'Activité'
}

function getToken() {
  return localStorage.getItem('targa_token') || ''
}

async function api(url, opts = {}) {
  const token = getToken()
  const res = await fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...opts.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

const Input = ({ label, type='text', value, onChange, placeholder }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
    <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', outline:'none', fontFamily:'DM Sans, sans-serif', background:'var(--white)', transition:'border-color 0.15s',
        boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }} />
  </div>
)

export default function AdminDashboard({ goPage, showToast }) {
  const [page, setPage] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [guides, setGuides] = useState([])
  const [activities, setActivities] = useState([])
  const [reservations, setReservations] = useState([])
  const [reviews, setReviews] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [resStatus, setResStatus] = useState('all')
  const [searchAct, setSearchAct] = useState('')
  const [searchRes, setSearchRes] = useState('')
  const [searchGuide, setSearchGuide] = useState('')
  const [searchReview, setSearchReview] = useState('')
  const [dashSearch, setDashSearch] = useState('')
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const loadStats = useCallback(async () => {
    try { setStats(await api('/admin/stats')) } catch {}
  }, [])
  const loadUsers = useCallback(async () => {
    try { setUsers(await api('/admin/users')) } catch {}
  }, [])
  const loadGuides = useCallback(async () => {
    try { setGuides(await api('/admin/guides')) } catch {}
  }, [])
  const loadActivities = useCallback(async () => {
    try { setActivities(await api('/admin/activities')) } catch {}
  }, [])
  const loadReservations = useCallback(async () => {
    try { setReservations(await api(`/admin/reservations${resStatus !== 'all' ? `?status=${resStatus}` : ''}`)) } catch {}
  }, [resStatus])
  const loadReviews = useCallback(async () => {
    try { setReviews(await api('/admin/reviews')) } catch {}
  }, [])
  const loadLogs = useCallback(async () => {
    try { setLogs(await api('/admin/logs')) } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadStats(), loadUsers(), loadGuides(), loadActivities(), loadReservations(), loadReviews(), loadLogs()])
      .finally(() => setLoading(false))
  }, [loadStats, loadUsers, loadGuides, loadActivities, loadReservations, loadReviews, loadLogs])

  useEffect(() => { loadReservations() }, [resStatus, loadReservations])
  useEffect(() => { loadActivities() }, [loadActivities])

  const changeRole = async (id, role) => {
    try {
      await api(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
      showToast(`Rôle modifié avec succès`)
      loadUsers()
    } catch { showToast('Erreur lors de la modification du rôle') }
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' })
      showToast(`${name} a été supprimé`)
      loadUsers()
      loadStats()
    } catch { showToast('Erreur') }
  }

  const updateResStatus = async (id, status) => {
    try {
      await api(`/admin/reservations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      showToast(`Réservation #${id} ${status === 'confirmé' ? 'confirmée' : status === 'annulé' ? 'annulée' : 'mise à jour'}`)
      loadReservations()
      loadStats()
    } catch { showToast('Erreur') }
  }

  const deleteActivity = async (id, title) => {
    if (!confirm(`Supprimer "${title}" ?`)) return
    try {
      await api(`/admin/activities/${id}`, { method: 'DELETE' })
      showToast(`${title} supprimé`)
      loadActivities()
      loadStats()
    } catch { showToast('Erreur') }
  }

  // --- CRUD modals ---
  const [formData, setFormData] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [modalMode, setModalMode] = useState(null)   // 'create'|'edit'
  const [modalType, setModalType] = useState(null)    // 'user'|'guide'|'activity'
  const [editingId, setEditingId] = useState(null)
  const [destinations, setDestinations] = useState([])

  useEffect(() => {
    api('/destinations').then(setDestinations).catch(() => {})
  }, [])

  const openUserModal = (mode, user) => {
    setModalType('user')
    setModalMode(mode)
    setEditingId(mode === 'edit' ? user.id : null)
    setFormData({ prenom: user?.prenom || '', nom: user?.nom || '', email: user?.email || '', password: '', role: user?.role || 'user' })
  }

  const openGuideModal = (mode, guide) => {
    setModalType('guide')
    setModalMode(mode)
    setEditingId(mode === 'edit' ? guide.id : null)
    setFormData({ nom: guide?.nom || '', prenom: guide?.prenom || '', ville: guide?.ville || '', telephone: guide?.telephone || '', langues: guide?.langues || '', specialite: guide?.specialite || '', description: guide?.description || '', instagram: guide?.instagram || '', linkedin: guide?.linkedin || '', whatsapp: guide?.whatsapp || '' })
  }

  const openActivityModal = (mode, act) => {
    setModalType('activity')
    setModalMode(mode)
    setEditingId(mode === 'edit' ? act.id : null)
    setFormData({ titre: act?.titre || '', description: act?.description || '', prix: act?.prix || '', categorie: act?.categorie || '', destination_slug: act?.destination_slug || '', ville: act?.ville || '' })
  }

  const closeModal = () => { setModalType(null); setModalMode(null); setEditingId(null); setFormData({}) }

  const saveUser = async () => {
    const { prenom, nom, email, password, role } = formData
    if (!prenom || !nom || !email) return showToast('Prénom, nom et email requis')
    if (modalMode === 'create' && !password) return showToast('Mot de passe requis')
    try {
      if (modalMode === 'create') {
        await api('/admin/users', { method: 'POST', body: JSON.stringify(formData) })
        showToast('Utilisateur créé')
      } else {
        await api(`/admin/users/${editingId}`, { method: 'PUT', body: JSON.stringify({ prenom, nom, email, role }) })
        showToast('Utilisateur modifié')
      }
      loadUsers(); loadStats(); closeModal()
    } catch (e) { showToast('Erreur') }
  }

  const saveGuide = async () => {
    const { nom, prenom } = formData
    if (!nom || !prenom) return showToast('Nom et prénom requis')
    try {
      if (modalMode === 'create') {
        await api('/admin/guides', { method: 'POST', body: JSON.stringify(formData) })
        showToast('Guide créé')
      } else {
        await api(`/admin/guides/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) })
        showToast('Guide modifié')
      }
      loadGuides(); loadStats(); closeModal()
    } catch (e) { showToast('Erreur') }
  }

  const deleteGuide = async (id, name) => {
    if (!confirm(`Supprimer le guide ${name} ?`)) return
    try {
      await api(`/admin/guides/${id}`, { method: 'DELETE' })
      showToast(`Guide ${name} supprimé`)
      loadGuides(); loadStats()
    } catch { showToast('Erreur') }
  }

  const saveActivity = async () => {
    const { titre, description, prix } = formData
    if (!titre || !description || !prix) return showToast('Titre, description et prix requis')
    try {
      if (modalMode === 'create') {
        await api('/admin/activities', { method: 'POST', body: JSON.stringify(formData) })
        showToast('Activité créée')
      } else {
        await api(`/admin/activities/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) })
        showToast('Activité modifiée')
      }
      loadActivities(); loadStats(); closeModal()
    } catch (e) { showToast('Erreur') }
  }

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (searchUser) {
      const q = searchUser.toLowerCase()
      if (!(u.prenom+' '+u.nom+' '+u.email).toLowerCase().includes(q)) return false
    }
    return true
  })

  const filteredReservations = reservations.filter(r =>
    searchRes ? (r.prenom + ' ' + r.nom + ' ' + (r.activity_titre || '')).toLowerCase().includes(searchRes.toLowerCase()) : true
  )

  const filteredActivities = activities.filter(a =>
    searchAct ? a.titre.toLowerCase().includes(searchAct.toLowerCase()) : true
  )

  const filteredGuides = guides.filter(g =>
    searchGuide ? (g.prenom+' '+g.nom+' '+(g.ville||'')+' '+(g.specialite||'')).toLowerCase().includes(searchGuide.toLowerCase()) : true
  )

  const filteredReviews = reviews.filter(r =>
    searchReview ? (r.auteur_prenom+' '+r.auteur_nom).toLowerCase().includes(searchReview.toLowerCase()) : true
  )

  const sidebar = (
    <div style={{ width:240, background:'var(--night)', minHeight:'calc(100vh - 66px)', padding:'1.5rem 0', borderRight:'1px solid rgba(232,200,122,0.08)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'0 1.2rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'9px', color:'rgba(232,200,122,0.4)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:'0.3rem' }}>Administration</div>
        <div style={{ fontSize:'11px', color:'var(--gold)', fontFamily:'Playfair Display', serif:'serif' }}>TARGA — Panel</div>
      </div>
      {PAGES.map(p => (
        <button key={p} onClick={() => setPage(p)}
          style={{
            display:'flex', alignItems:'center', gap:'10px', padding:'10px 1.2rem', width:'100%', border:'none', background:'transparent',
            color: page === p ? 'var(--gold)' : 'rgba(255,255,255,0.45)', cursor:'pointer',
            fontSize:'11px', letterSpacing:'0.06em', fontWeight: page === p ? 600 : 400, textTransform:'uppercase',
            borderLeft: page === p ? '3px solid var(--copper)' : '3px solid transparent',
            background: page === p ? 'rgba(188,79,0,0.08)' : 'transparent',
            transition:'all 0.2s', fontFamily:'DM Sans', sansSerif:'sans-serif'
          }}>
          <span style={{ fontSize:'14px' }}>{['📊','👥','🧭','📋','💬','🎯','🔐','📜'][PAGES.indexOf(p)]}</span>
          {PAGE_TITLES[p]}
        </button>
      ))}
      <div style={{ marginTop:'auto', padding:'1rem 1.2rem', borderTop:'1px solid rgba(232,200,122,0.06)' }}>
        <button onClick={() => goPage('accueil')}
          style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(232,200,122,0.12)', borderRadius:'20px', color:'rgba(255,255,255,0.5)', fontSize:'10px', letterSpacing:'0.06em', cursor:'pointer', textTransform:'uppercase' }}>
          ← Retour au site
        </button>
      </div>
    </div>
  )

  const dateStr = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { year:'numeric', month:'short', day:'numeric' }) : ''

  const SearchResults = ({ query, users:us, guides:gs, activities:as, reservations:rs, dateStr:ds, goPage:gp }) => {
    const q = query.toLowerCase().trim()
    const filtered = [
      ...us.filter(u => (u.prenom+' '+u.nom+' '+u.email).toLowerCase().includes(q)).map(u => ({ type:'👥', label:'Utilisateur', name:u.prenom+' '+u.nom, sub:u.email, onClick:() => { setPage('utilisateurs'); setSearchUser(q) } })),
      ...gs.filter(g => (g.prenom+' '+g.nom+' '+g.ville+' '+(g.specialite||'')).toLowerCase().includes(q)).map(g => ({ type:'🧭', label:'Guide', name:g.prenom+' '+g.nom, sub:g.ville+' · '+g.specialite, onClick:() => setPage('guides') })),
      ...as.filter(a => (a.titre+' '+(a.destination_nom||a.ville||'')+' '+a.categorie).toLowerCase().includes(q)).map(a => ({ type:'🎯', label:'Activité', name:a.titre, sub:(a.destination_nom||a.ville||'')+' · '+a.prix+' MAD', onClick:() => setPage('activites') })),
      ...rs.filter(r => (r.prenom+' '+r.nom+' '+(r.activity_titre||'')).toLowerCase().includes(q)).map(r => ({ type:'📋', label:'Réservation #'+r.id, name:r.prenom+' '+r.nom, sub:r.activity_titre||'', onClick:() => setPage('reservations') })),
    ]
    if (!q) return null
    return (
      <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'12px', fontStyle:'italic' }}>Aucun résultat pour « {query} »</div>
        ) : (
          <>
            <div style={{ padding:'0.7rem 1.2rem', background:'var(--sand)', borderBottom:'1px solid var(--border)', fontSize:'10px', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</div>
            {filtered.map((r, i) => (
              <div key={i} onClick={r.onClick} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.8rem 1.2rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--sand)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(188,79,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{r.type}</div>
                <div>
                  <div style={{ fontSize:'12px', color:'var(--night)', fontWeight:600 }}>{r.name}</div>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>{r.label} · {r.sub}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 66px)', background:'var(--sand)' }}>
      {sidebar}
      <div style={{ flex:1, overflow:'auto' }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 2rem', background:'var(--white)', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:'1.1rem', fontFamily:'Playfair Display, serif', fontWeight:700, color:'var(--night)' }}>{PAGE_TITLES[page]}</div>
            <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>{today}</div>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{loading ? 'Chargement…' : ''}</span>
          </div>
        </div>

        <div style={{ padding:'1.5rem 2rem' }}>
          {/* ═══ DASHBOARD ═══ */}
          {page === 'dashboard' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
                {[
                  { label:'Utilisateurs', value:stats?.users||0, icon:'👥', color:'var(--teal)' },
                  { label:'Guides', value:stats?.guides||0, icon:'🧭', color:'var(--copper)' },
                  { label:'Activités', value:stats?.activities||0, icon:'🎯', color:'#88532f' },
                  { label:'Destinations', value:stats?.destinations||0, icon:'📍', color:'var(--teal)' },
                  { label:'Réservations', value:stats?.reservations||0, icon:'📋', color:'#367588' },
                  { label:'En attente', value:stats?.pendingReservations||0, icon:'⏳', color:'#D4A843' },
                  { label:'Avis', value:stats?.reviews||0, icon:'💬', color:'#88532f' },
                ].map((s, i) => (
                  <div key={i} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.2rem', borderTop:`3px solid ${s.color}` }}>
                    <div style={{ fontSize:'1.6rem', marginBottom:'0.5rem' }}>{s.icon}</div>
                    <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--night)', fontFamily:'Playfair Display, serif', lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'9px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:'0.3rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <input value={dashSearch} onChange={e => setDashSearch(e.target.value)}
                style={{ width:'100%', padding:'10px 16px', border:'1px solid var(--border)', borderRadius:'10px', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box', marginBottom:'1rem' }}
                placeholder="🔍 Rechercher en temps réel (utilisateurs, guides, activités, réservations…)"/>
              {dashSearch ? (
                <SearchResults query={dashSearch} users={users} guides={guides} activities={activities} reservations={reservations} dateStr={dateStr} goPage={goPage} />
              ) : (
                <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', padding:'2rem', textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.8rem', opacity:0.3 }}>📊</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontStyle:'italic' }}>Bienvenue dans le panneau d'administration TARGA.<br/>Utilisez la barre latérale pour gérer la plateforme.</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ UTILISATEURS ═══ */}
          {page === 'utilisateurs' && (
            <div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                <input style={{ padding:'8px 14px', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', background:'var(--white)', fontFamily:'DM Sans', sansSerif:'sans-serif', flex:1, minWidth:'200px', outline:'none' }}
                  placeholder="Rechercher un utilisateur…" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                {['all','admin','guide','user'].map(r => {
                  const active = roleFilter === r
                  const colors = { admin:'var(--copper)', guide:'#8B6500', user:'var(--teal)' }
                  return (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    style={{
                      padding:'5px 12px', borderRadius:'6px', border: active ? 'none' : '1px solid var(--border)',
                      background: active ? (colors[r] || 'var(--teal)') : 'transparent',
                      color: active ? 'white' : 'var(--text-muted)',
                      fontSize:'10px', fontWeight: active ? 600 : 400, letterSpacing:'0.04em', cursor:'pointer',
                      transition:'all 0.15s' }}>
                    {r === 'all' ? 'Tous' : r === 'admin' ? 'Admins' : r === 'guide' ? 'Guides' : 'Utilisateurs'}
                  </button>
                  )
                })}
                <button onClick={() => openUserModal('create')}
                  style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid var(--copper)', background:'transparent', color:'var(--copper)', fontSize:'10px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                  + Ajouter
                </button>
              </div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'var(--sand)', borderBottom:'1px solid var(--border)' }}>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Nom</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Email</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Rôle</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Date</th>
                      <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{u.prenom} {u.nom}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{
                            display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'9px', fontWeight:600,
                            background: u.role === 'admin' ? 'rgba(188,79,0,0.1)' : u.role === 'guide' ? 'rgba(232,200,122,0.1)' : 'rgba(54,117,136,0.1)',
                            color: u.role === 'admin' ? 'var(--copper)' : u.role === 'guide' ? '#8B6500' : 'var(--teal)',
                            textTransform:'uppercase', letterSpacing:'0.05em'
                          }}>{u.role}</span>
                        </td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'11px' }}>{dateStr(u.created_at)}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <div style={{ display:'flex', gap:'4px', justifyContent:'center', flexWrap:'wrap' }}>
                            <button onClick={() => openUserModal('edit', u)}
                              style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--teal)', background:'transparent', color:'var(--teal)', fontSize:'9px', cursor:'pointer' }}>
                              Modifier
                            </button>
                            {u.role === 'user' && (
                              <button onClick={() => changeRole(u.id, 'guide')}
                                style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:'var(--teal)', color:'white', fontSize:'9px', cursor:'pointer' }}>
                                Promouvoir guide
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button onClick={() => changeRole(u.id, 'admin')}
                                style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:'var(--copper)', color:'white', fontSize:'9px', cursor:'pointer' }}>
                                Admin
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button onClick={() => deleteUser(u.id, u.prenom + ' ' + u.nom)}
                                style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #D93838', background:'transparent', color:'#D93838', fontSize:'9px', cursor:'pointer' }}>
                                Suppr.
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>Aucun utilisateur trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ GUIDES ═══ */}
          {page === 'guides' && (
            <div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                <input style={{ padding:'8px 14px', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', background:'var(--white)', fontFamily:'DM Sans', sansSerif:'sans-serif', flex:1, minWidth:'200px', outline:'none' }}
                  placeholder="Rechercher un guide par nom, prénom, ville…" value={searchGuide} onChange={e => setSearchGuide(e.target.value)} />
                <button onClick={() => openGuideModal('create')}
                  style={{ padding:'7px 16px', borderRadius:'20px', border:'none', background:'var(--gradient-copper)', color:'white', fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
                  + Ajouter un guide
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'0.75rem' }}>
                {filteredGuides.map(g => (
                  <div key={g.id} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                    <div style={{ padding:'1.5rem 1.2rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'var(--sand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', border:'2px solid var(--border)' }}>{'👤'}</div>
                      <div>
                        <div style={{ fontWeight:700, fontFamily:'Playfair Display, serif', fontSize:'1.05rem', color:'var(--night)' }}>{g.prenom} {g.nom}</div>
                        <div style={{ fontSize:'10px', color:'var(--copper)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{g.ville} · {g.specialite}</div>
                      </div>
                    </div>
                    <div style={{ padding:'0 1.2rem 1.2rem', fontSize:'11px', color:'var(--text-muted)', lineHeight:1.6 }}>
                      {g.description}
                    </div>
                    <div style={{ padding:'0.7rem 1.2rem', borderTop:'1px solid var(--border)', display:'flex', gap:'0.5rem', alignItems:'center', justifyContent:'flex-end' }}>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <button onClick={() => openGuideModal('edit', g)}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--teal)', background:'transparent', color:'var(--teal)', fontSize:'9px', cursor:'pointer' }}>
                          Modifier
                        </button>
                        <button onClick={() => deleteGuide(g.id, g.prenom + ' ' + g.nom)}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #D93838', background:'transparent', color:'#D93838', fontSize:'9px', cursor:'pointer' }}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredGuides.length === 0 && (
                  <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'12px', fontStyle:'italic', gridColumn:'1 / -1' }}>Aucun guide trouvé</div>
                )}
              </div>
            </div>
          )}

          {/* ═══ RÉSERVATIONS ═══ */}
          {page === 'reservations' && (
            <div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                <input style={{ padding:'8px 14px', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', background:'var(--white)', fontFamily:'DM Sans', sansSerif:'sans-serif', flex:1, minWidth:'200px', outline:'none' }}
                  placeholder="Rechercher par client, activité…" value={searchRes} onChange={e => setSearchRes(e.target.value)} />
                {['all','en_attente','confirmé','annulé'].map(s => {
                  const active = resStatus === s
                  const colors = { en_attente:'#D4A843', confirmé:'var(--teal)', annulé:'#D93838' }
                  return (
                  <button key={s} onClick={() => setResStatus(s)}
                    style={{
                      padding:'5px 12px', borderRadius:'6px', border: active ? 'none' : '1px solid var(--border)',
                      background: active ? (colors[s] || 'var(--copper)') : 'transparent',
                      color: active ? 'white' : 'var(--text-muted)',
                      fontSize:'10px', fontWeight: active ? 600 : 400, letterSpacing:'0.04em', cursor:'pointer',
                      transition:'all 0.15s' }}>
                    {s === 'all' ? 'Toutes' : s === 'en_attente' ? 'En attente' : s === 'confirmé' ? 'Confirmées' : 'Annulées'}
                  </button>
                  )
                })}
              </div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'var(--sand)', borderBottom:'1px solid var(--border)' }}>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>#</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Client</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Activité</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Date</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Statut</th>
                      <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map(r => (
                      <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 14px', fontWeight:700 }}>#{r.id}</td>
                        <td style={{ padding:'10px 14px' }}>{r.prenom} {r.nom}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)' }}>{r.activity_titre || '—'}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'11px' }}>{r.date_reservation}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{
                            display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'9px', fontWeight:600,
                            background: r.statut === 'confirmé' ? 'rgba(54,117,136,0.1)' : r.statut === 'annulé' ? 'rgba(217,56,56,0.1)' : 'rgba(212,168,67,0.1)',
                            color: r.statut === 'confirmé' ? 'var(--teal)' : r.statut === 'annulé' ? '#D93838' : '#D4A843',
                            textTransform:'uppercase', letterSpacing:'0.05em'
                          }}>{r.statut}</span>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <div style={{ display:'flex', gap:'4px', justifyContent:'center' }}>
                            {r.statut !== 'confirmé' && r.statut !== 'annulé' && (
                              <>
                                <button onClick={() => updateResStatus(r.id, 'confirmé')}
                                  style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:'var(--teal)', color:'white', fontSize:'9px', cursor:'pointer' }}>✓</button>
                                <button onClick={() => updateResStatus(r.id, 'annulé')}
                                  style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #D93838', background:'transparent', color:'#D93838', fontSize:'9px', cursor:'pointer' }}>✕</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReservations.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>Aucune réservation trouvée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ AVIS (lecture seule) ═══ */}
          {page === 'avis' && (
            <div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                <input style={{ padding:'8px 14px', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', background:'var(--white)', fontFamily:'DM Sans', sansSerif:'sans-serif', flex:1, minWidth:'200px', outline:'none' }}
                  placeholder="Rechercher un avis par nom ou prénom…" value={searchReview} onChange={e => setSearchReview(e.target.value)} />
              </div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'var(--sand)', borderBottom:'1px solid var(--border)' }}>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Auteur</th>
                      <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>👍 Likes</th>
                      <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>👎 Dislikes</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Commentaire</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Destination</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map(r => (
                      <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{r.auteur_prenom} {r.auteur_nom}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', color:'var(--teal)', fontWeight:700 }}>{r.likes ?? 0}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', color:'#D93838', fontWeight:700 }}>{r.dislikes ?? 0}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'11px' }}>{r.commentaire}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'11px' }}>{r.destination || '—'}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'11px' }}>{dateStr(r.created_at)}</td>
                      </tr>
                    ))}
                    {filteredReviews.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>Aucun avis</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ padding:'0.8rem 1.2rem', background:'#faf7f2', borderTop:'1px solid var(--border)', fontSize:'10px', color:'var(--muted)', fontStyle:'italic', textAlign:'center' }}>
                  Les avis et évaluations sont en lecture seule — ils ne peuvent pas être modifiés.
                </div>
              </div>
            </div>
          )}

          {/* ═══ RÔLES ═══ */}
          {page === 'roles' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.2rem' }}>
              {[
                { title:'Visiteur', icon:'👤', color:'var(--teal)', count:`${stats?.users||0} utilisateurs`,
                  perms:[
                    '✅ Consulter la carte','✅ Voir les activités','✅ Voir les guides',
                    '✅ Laisser un avis (identité)','🔒 Réserver une activité (connexion)','🔒 Planifier un itinéraire IA',
                    '❌ Gérer des activités','❌ Accès administration'
                  ]
                },
                { title:'Guide', icon:'🧭', color:'#8B6500', count:`${stats?.guides||0} guides`,
                  perms:[
                    '✅ Toutes les permissions Visiteur','✅ Gérer son profil guide','✅ Créer/modifier ses activités',
                    '✅ Consulter ses réservations','✅ Répondre aux avis','✅ Gérer ses disponibilités',
                    '❌ Gérer d\'autres utilisateurs','❌ Accès administration'
                  ]
                },
                { title:'Admin', icon:'🔐', color:'var(--copper)', count:'Administrateurs',
                  perms:[
                    '✅ Toutes les permissions Guide','✅ Gérer tous les utilisateurs','✅ Valider les guides',
                    '✅ Modérer les avis','✅ Gérer les rôles','✅ Accès complet administration',
                    '✅ Consulter les logs','✅ Configuration système'
                  ]
                },
              ].map((r, i) => (
                <div key={i} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', borderTop:`3px solid ${r.color}`, padding:'1.4rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1rem' }}>
                    <span style={{ fontSize:'1.4rem' }}>{r.icon}</span>
                    <div>
                      <div style={{ fontFamily:'Playfair Display, serif', fontSize:'0.85rem', fontWeight:700, color:r.color }}>{r.title}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>{r.count}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', fontSize:'11px' }}>
                    {r.perms.map((p, j) => (
                      <div key={j} style={{ color: p.startsWith('✅') ? 'var(--text)' : p.startsWith('🔒') ? 'var(--copper)' : 'var(--text-muted)', opacity: p.startsWith('❌') ? 0.5 : 1 }}>{p}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ ACTIVITÉS ═══ */}
          {page === 'activites' && (
            <div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                <input style={{ padding:'8px 14px', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', background:'var(--white)', fontFamily:'DM Sans', sansSerif:'sans-serif', flex:1, minWidth:'200px', outline:'none' }}
                  placeholder="Rechercher une activité…" value={searchAct} onChange={e => setSearchAct(e.target.value)} />
                <button onClick={() => openActivityModal('create')}
                  style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid var(--copper)', background:'transparent', color:'var(--copper)', fontSize:'10px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                  + Ajouter
                </button>
              </div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'var(--sand)', borderBottom:'1px solid var(--border)' }}>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Titre</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Destination</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Prix</th>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Catégorie</th>
                      <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:600, color:'var(--text-muted)', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map(a => (
                      <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{CATEGORY_ICON[a.categorie] || '✦'} {a.titre}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)' }}>{a.destination_nom || a.ville || '—'}</td>
                        <td style={{ padding:'10px 14px', color:'var(--copper)', fontWeight:700 }}>{a.prix} MAD</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'20px', fontSize:'9px', fontWeight:600, background:'rgba(54,117,136,0.08)', color:'var(--teal)' }}>{a.categorie}</span>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <div style={{ display:'flex', gap:'4px', justifyContent:'center' }}>
                            <button onClick={() => openActivityModal('edit', a)}
                              style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--teal)', background:'transparent', color:'var(--teal)', fontSize:'9px', cursor:'pointer' }}>
                              Modifier
                            </button>
                            <button onClick={() => deleteActivity(a.id, a.titre)}
                              style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #D93838', background:'transparent', color:'#D93838', fontSize:'9px', cursor:'pointer' }}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredActivities.length === 0 && (
                      <tr><td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>Aucune activité trouvée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {page === 'logs' && (
            <div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem' }}>
                {logs.map((l, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.75rem', padding:'0.8rem 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(188,79,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{l.icon}</div>
                    <div>
                      <div style={{ fontSize:'12px', color:'var(--text)' }}><strong>{l.user}</strong> — {l.action}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>{new Date(l.time).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal CRUD */}
      {modalType && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}
          onClick={closeModal}>
          <div style={{ maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:'12px', maxWidth:'520px', width:'100%', position:'relative', boxShadow:'0 8px 30px rgba(0,0,0,0.12)', animation:'modalUp 0.25s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background:'#fff', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Playfair Display, serif', fontSize:'1rem', fontWeight:700, color:'var(--night)' }}>
                {modalMode === 'create' ? 'Créer' : 'Modifier'} {modalType === 'user' ? "un utilisateur" : modalType === 'guide' ? 'un guide' : 'une activité'}
              </div>
              <button onClick={closeModal} style={{ width:'28px', height:'28px', borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ background:'#fff', padding:'1.25rem 1.5rem 1.5rem' }}>

            {/* ═══ User Form ═══ */}
            {modalType === 'user' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <Input label="Prénom" value={formData.prenom} onChange={v => setFormData({...formData, prenom: v})} />
                  <Input label="Nom" value={formData.nom} onChange={v => setFormData({...formData, nom: v})} />
                </div>
                <Input label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                {modalMode === 'create' && (
                  <div style={{ position:'relative' }}>
                    <Input label="Mot de passe" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={v => setFormData({...formData, password: v})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position:'absolute', right:'8px', top:'1.35rem', background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'var(--text-muted)', padding:'4px', lineHeight:1 }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Rôle</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}>
                    <option value="user">Utilisateur</option>
                    <option value="guide">Guide</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:'0.6rem', justifyContent:'flex-end', marginTop:'0.8rem' }}>
                  <button onClick={closeModal} style={{ padding:'9px 22px', borderRadius:'8px', border:'1.5px solid var(--border)', background:'var(--sand)', color:'var(--text-muted)', fontSize:'11px', fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}>Annuler</button>
                  <button onClick={saveUser} style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background:'var(--copper)', color:'white', fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                    {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ Guide Form ═══ */}
            {modalType === 'guide' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <Input label="Prénom" value={formData.prenom} onChange={v => setFormData({...formData, prenom: v})} />
                  <Input label="Nom" value={formData.nom} onChange={v => setFormData({...formData, nom: v})} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Ville</label>
                  <select value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}>
                    <option value="">—</option>
                    {destinations.map(d => <option key={d.slug} value={d.nom}>{d.nom}</option>)}
                  </select>
                </div>
                <Input label="Téléphone" value={formData.telephone} onChange={v => setFormData({...formData, telephone: v})} />
                <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Langues</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                    {['AR','FR','EN','ES','DE','IT','PT','TZ'].map(l => {
                      const checked = (formData.langues||'').split(',').map(s => s.trim()).includes(l)
                      return (
                        <label key={l} style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'5px 10px', borderRadius:'6px', border:'1.5px solid var(--border)', background: checked ? 'rgba(54,117,136,0.08)' : 'transparent', cursor:'pointer', fontSize:'11px', fontWeight: checked ? 600 : 400, color: checked ? 'var(--teal)' : 'var(--text-muted)', transition:'all 0.15s' }}>
                          <input type="checkbox" checked={checked} onChange={() => {
                            const current = (formData.langues||'').split(',').map(s => s.trim()).filter(Boolean)
                            const next = checked ? current.filter(x => x !== l) : [...current, l]
                            setFormData({...formData, langues: next.join(',')})
                          }} style={{ display:'none' }} />
                          {l}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Spécialité</label>
                  <select value={formData.specialite} onChange={e => setFormData({...formData, specialite: e.target.value})}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}>
                    <option value="">—</option>
                    {['Médinas et architecture andalouse','Artisanat et gastronomie','Cinéma et désert','Art gnawa et culture','Rif et Talassemtane','Patrimoine impérial','Sahara et traditions touarègues','Détroit et littérature','Surf et sports nautiques','Trek et montagne','Culture berbère','Histoire et UNESCO','Musique et festivals','Gastronomie et terroir','Photographie','Écotourisme et nature'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', outline:'none', resize:'vertical', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)', background:'var(--white)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
                  <Input label="Instagram" value={formData.instagram} onChange={v => setFormData({...formData, instagram: v})} placeholder="https://instagram.com/..." />
                  <Input label="LinkedIn" value={formData.linkedin} onChange={v => setFormData({...formData, linkedin: v})} placeholder="https://linkedin.com/in/..." />
                  <Input label="WhatsApp" value={formData.whatsapp} onChange={v => setFormData({...formData, whatsapp: v})} placeholder="+212XXXXXXXXX" />
                </div>
                <div style={{ display:'flex', gap:'0.6rem', justifyContent:'flex-end', marginTop:'0.8rem' }}>
                  <button onClick={closeModal} style={{ padding:'9px 22px', borderRadius:'8px', border:'1.5px solid var(--border)', background:'var(--sand)', color:'var(--text-muted)', fontSize:'11px', fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}>Annuler</button>
                  <button onClick={saveGuide} style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background:'var(--copper)', color:'white', fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                    {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ Activity Form ═══ */}
            {modalType === 'activity' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <Input label="Titre" value={formData.titre} onChange={v => setFormData({...formData, titre: v})} />
                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', outline:'none', resize:'vertical', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)', background:'var(--white)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <Input label="Prix (MAD)" type="number" value={formData.prix} onChange={v => setFormData({...formData, prix: v})} />
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                    <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Catégorie</label>
                    <select value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})}
                      style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}>
                      {['Culture','Gastronomie','Nature','Bien-être','Histoire','Artisanat','Désert','Aventure','Surf','Mer','Trek','Musique','Sport','UNESCO','Cinéma'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <label style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Destination</label>
                  <select value={formData.destination_slug} onChange={e => setFormData({...formData, destination_slug: e.target.value})}
                    style={{ padding:'10px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', background:'var(--white)', outline:'none', fontFamily:'DM Sans, sans-serif', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}>
                    <option value="">—</option>
                    {destinations.map(d => (
                      <option key={d.slug} value={d.slug}>{d.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:'flex', gap:'0.6rem', justifyContent:'flex-end', marginTop:'0.8rem' }}>
                  <button onClick={closeModal} style={{ padding:'9px 22px', borderRadius:'8px', border:'1.5px solid var(--border)', background:'var(--sand)', color:'var(--text-muted)', fontSize:'11px', fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}>Annuler</button>
                  <button onClick={saveActivity} style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background:'var(--copper)', color:'white', fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                    {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
