import { useState } from 'react'

export default function ReservationForm({ activityId, onSubmit, onCancel, submitting }) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [nbPersonnes, setNbPersonnes] = useState(1)
  const [dateResa, setDateResa] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!prenom.trim()) e.prenom = 'Requis'
    if (!nom.trim()) e.nom = 'Requis'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Email invalide'
    if (!dateResa) e.dateResa = 'Requis'
    else if (new Date(dateResa) <= new Date()) e.dateResa = 'Doit être dans le futur'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      activity_id: activityId,
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.trim(),
      telephone: telephone.trim() || null,
      nombre_personnes: nbPersonnes,
      date_reservation: dateResa,
      message: message.trim() || null,
    })
  }

  return (
    <form className="resa-form" onSubmit={handleSubmit}>
      <h3 className="resa-form-title">✦ Formulaire de réservation</h3>

      <div className="resa-row">
        <div className="form-inp-wrap">
          <label className="form-lbl">Prénom</label>
          <input className={`form-inp ${errors.prenom ? 'error' : ''}`} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" />
          {errors.prenom && <span className="form-err">{errors.prenom}</span>}
        </div>
        <div className="form-inp-wrap">
          <label className="form-lbl">Nom</label>
          <input className={`form-inp ${errors.nom ? 'error' : ''}`} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" />
          {errors.nom && <span className="form-err">{errors.nom}</span>}
        </div>
      </div>

      <div className="resa-row">
        <div className="form-inp-wrap">
          <label className="form-lbl">Email</label>
          <input className={`form-inp ${errors.email ? 'error' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" />
          {errors.email && <span className="form-err">{errors.email}</span>}
        </div>
        <div className="form-inp-wrap">
          <label className="form-lbl">Téléphone</label>
          <input className="form-inp" type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+212 6XX XXX XXX" />
        </div>
      </div>

      <div className="resa-row">
        <div className="form-inp-wrap">
          <label className="form-lbl">Nombre de personnes</label>
          <select className="form-select" value={nbPersonnes} onChange={e => setNbPersonnes(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'personne' : 'personnes'}</option>)}
          </select>
        </div>
        <div className="form-inp-wrap">
          <label className="form-lbl">Date de réservation</label>
          <input className={`form-inp ${errors.dateResa ? 'error' : ''}`} type="date" value={dateResa} onChange={e => setDateResa(e.target.value)} />
          {errors.dateResa && <span className="form-err">{errors.dateResa}</span>}
        </div>
      </div>

      <div className="form-inp-wrap">
        <label className="form-lbl">Message (optionnel)</label>
        <textarea className="form-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="Précisions, demandes spéciales…" rows={3}></textarea>
      </div>

      <div className="resa-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'Envoi en cours…' : 'Confirmer la réservation ✦'}
        </button>
      </div>
    </form>
  )
}
