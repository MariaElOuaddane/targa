import { useState, useCallback } from 'react'
import Header from './components/Header'
import Accueil from './components/Accueil'
import MapPage from './components/MapPage'
import ActivitiesPage from './components/ActivitiesPage'
import GuidesPage from './components/GuidesPage'
import AvisPage from './components/AvisPage'
import PlanifPage from './components/PlanifPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import ProfilePage from './components/ProfilePage'
import AdminDashboard from './components/AdminDashboard'
import DestinationsPage from './components/DestinationsPage'
import DestinationDetail from './components/DestinationDetail'
import AllReviewsPage from './components/AllReviewsPage'

const PAGES = ['accueil', 'carte', 'activites', 'guides', 'avis', 'planif', 'login', 'signup', 'profile', 'admin', 'destinations', 'destination', 'tous-avis']

export default function App() {
  const [page, setPage] = useState('accueil')
  const [pageMeta, setPageMeta] = useState(null)
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('targa_user')
    try { return saved ? JSON.parse(saved) : null } catch { return null }
  })

  const goPage = useCallback((p, meta) => {
    if (PAGES.includes(p)) { setPage(p) }
    setPageMeta(meta !== undefined ? meta : null)
    window.scrollTo(0, 0)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const onAuth = useCallback((u) => {
    setUser(u)
  }, [])

  const onLogout = useCallback(() => {
    localStorage.removeItem('targa_token')
    localStorage.removeItem('targa_user')
    setUser(null)
  }, [])

  const common = { goPage, showToast }

  return (
    <>
      <Header page={page} goPage={goPage} user={user} onLogout={onLogout} />
      <div className={`page ${page === 'accueil' ? 'active' : ''}`}>
        <Accueil {...common} />
      </div>
      <div className={`page ${page === 'carte' ? 'active' : ''}`}>
        <MapPage {...common} isActive={page === 'carte'} />
      </div>
      <div className={`page ${page === 'activites' ? 'active' : ''}`}>
        <ActivitiesPage {...common} destSlug={pageMeta} />
      </div>
      <div className={`page ${page === 'guides' ? 'active' : ''}`}>
        <GuidesPage {...common} destSlug={pageMeta} />
      </div>
      <div className={`page ${page === 'avis' ? 'active' : ''}`}>
        <AvisPage {...common} destSlug={pageMeta} />
      </div>
      <div className={`page ${page === 'planif' ? 'active' : ''}`}>
        <PlanifPage {...common} />
      </div>
      <div className={`page ${page === 'login' ? 'active' : ''}`}>
        <LoginPage {...common} onAuth={onAuth} />
      </div>
      <div className={`page ${page === 'signup' ? 'active' : ''}`}>
        <SignupPage {...common} onAuth={onAuth} />
      </div>
      <div className={`page ${page === 'profile' ? 'active' : ''}`}>
        <ProfilePage user={user} onLogout={onLogout} {...common} />
      </div>
      <div className={`page ${page === 'admin' ? 'active' : ''}`}>
        <AdminDashboard goPage={goPage} showToast={showToast} />
      </div>
      <div className={`page ${page === 'destinations' ? 'active' : ''}`}>
        <DestinationsPage {...common} />
      </div>
      <div className={`page ${page === 'destination' ? 'active' : ''}`}>
        <DestinationDetail {...common} slug={pageMeta} />
      </div>
      <div className={`page ${page === 'tous-avis' ? 'active' : ''}`}>
        <AllReviewsPage {...common} destSlug={pageMeta} />
      </div>
      <div id="toast" className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
