export default function Header({ page, goPage, user }) {
  const isActive = (p) => page === p ? 'active' : ''
  return (
    <header>
      <div className="header-inner">
        <div className="logo-wrap" onClick={() => goPage('accueil')}>
          <div className="logo-arch"></div>
          <div className="logo-text">
            <span className="logo-name">TARGA</span>
            <span className="logo-sub">Travelling Morocco</span>
          </div>
        </div>
        <nav>
          <button className={`nav-btn ${isActive('accueil')}`} onClick={() => goPage('accueil')}>Accueil</button>
          <button className={`nav-btn ${isActive('destinations')}`} onClick={() => goPage('destinations')}>Destinations</button>
          <button className={`nav-btn ${isActive('carte')}`} onClick={() => goPage('carte')}>Carte</button>
          <button className={`nav-btn ${isActive('activites')}`} onClick={() => goPage('activites')}>Activités</button>
          <button className={`nav-btn ${isActive('guides')}`} onClick={() => goPage('guides')}>Guides</button>
          <button className={`nav-btn ${isActive('avis')}`} onClick={() => goPage('avis')}>Avis</button>
          <button className={`nav-btn ${isActive('planif')}`} onClick={() => goPage('planif')}>Planificateur</button>
          {user && user.role === 'admin' && (
            <button className={`nav-btn ${isActive('admin')}`} style={{color:'var(--gold)'}} onClick={() => goPage('admin')}>
              Admin
            </button>
          )}
          {user ? (
            <button className={`nav-btn nav-special ${isActive('profile')}`} onClick={() => goPage('profile')}>
              {user.prenom} · Profil
            </button>
          ) : (
            <button className={`nav-btn nav-special ${isActive('login')}`} onClick={() => goPage('login')}>
              Connexion
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
