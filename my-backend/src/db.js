import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'database.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    region TEXT NOT NULL,
    type_touristique TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    description TEXT NOT NULL,
    climat TEXT,
    hebergement TEXT,
    icone TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    prix INTEGER NOT NULL,
    categorie TEXT NOT NULL,
    destination_slug TEXT NOT NULL,
    ville TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (destination_slug) REFERENCES destinations(slug)
  );

  CREATE TABLE IF NOT EXISTS guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    ville TEXT,
    telephone TEXT,
    langues TEXT,
    specialite TEXT,
    photo_url TEXT,
    description TEXT,
    instagram TEXT,
    linkedin TEXT,
    whatsapp TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auteur_prenom TEXT NOT NULL,
    auteur_nom TEXT NOT NULL,
    commentaire TEXT NOT NULL,
    destination TEXT,
    user_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'guide')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT NOT NULL,
    nombre_personnes INTEGER NOT NULL,
    date_reservation TEXT NOT NULL,
    message TEXT,
    statut TEXT DEFAULT 'en_attente',
    user_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS guide_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guide_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, guide_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (guide_id) REFERENCES guides(id)
  );

  CREATE TABLE IF NOT EXISTS destination_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, destination_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (destination_id) REFERENCES destinations(id)
  );

  CREATE TABLE IF NOT EXISTS activity_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, activity_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
  );

  CREATE TABLE IF NOT EXISTS review_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    review_id INTEGER NOT NULL,
    is_like INTEGER NOT NULL CHECK(is_like IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, review_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (review_id) REFERENCES evaluations(id)
  );
`);

try {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE evaluations ADD COLUMN user_id INTEGER").run();
} catch (e) {}
try { db.prepare("ALTER TABLE guides ADD COLUMN instagram TEXT").run() } catch (e) {}
try { db.prepare("ALTER TABLE guides ADD COLUMN linkedin TEXT").run() } catch (e) {}
try { db.prepare("ALTER TABLE guides ADD COLUMN whatsapp TEXT").run() } catch (e) {}
try {
  db.prepare("ALTER TABLE reservations ADD COLUMN user_id INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE guides ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
} catch (e) {}

const destCount = db.prepare('SELECT COUNT(*) as count FROM destinations').get();
if (destCount.count === 0) {
  const insertDest = db.prepare(`
    INSERT INTO destinations (slug, nom, region, type_touristique, latitude, longitude, description, climat, hebergement, icone)
    VALUES (@slug, @nom, @region, @type_touristique, @latitude, @longitude, @description, @climat, @hebergement, @icone)
  `);

  const destinations = [
    { slug: 'marrakech', nom: 'Marrakech', region: 'Marrakech-Safi', type_touristique: 'imp', latitude: 31.6295, longitude: -7.9811, description: 'La ville ocre, joyau du Sud marocain', climat: 'Chaud · Tempéré en hiver', hebergement: 'Riads, Hôtels de luxe, Hostels', icone: '🏛️' },
    { slug: 'fes', nom: 'Fès', region: 'Fès-Meknès', type_touristique: 'imp', latitude: 34.0333, longitude: -5.0000, description: 'Capitale spirituelle et culturelle du Maroc', climat: 'Continental · Chaud l\'été', hebergement: 'Riads historiques, Dar', icone: '🏺' },
    { slug: 'merzouga', nom: 'Merzouga & Erg Chebbi', region: 'Drâa-Tafilalet', type_touristique: 'des', latitude: 31.0983, longitude: -4.0033, description: 'Les plus hautes dunes du Maroc, porte du Sahara', climat: 'Désertique · Nuits fraîches', hebergement: 'Bivouacs de luxe, Kasbahs', icone: '🐪' },
    { slug: 'agadir', nom: 'Agadir & Taghazout', region: 'Souss-Massa', type_touristique: 'cot', latitude: 30.4278, longitude: -9.5981, description: 'Station balnéaire et capitale du surf marocain', climat: 'Doux toute l\'année', hebergement: 'Resorts, Surf Camps', icone: '🏄' },
    { slug: 'atlas', nom: 'Haut Atlas (Imlil/Toubkal)', region: 'Marrakech-Safi', type_touristique: 'mon', latitude: 31.1344, longitude: -7.9192, description: 'Le toit de l\'Afrique du Nord, trek et nature', climat: 'Montagneux · Neige en hiver', hebergement: 'Refuges, Gîtes berbères', icone: '🏔️' },
    { slug: 'chefchaouen', nom: 'Chefchaouen', region: 'Tanger-Tétouan-Al Hoceïma', type_touristique: 'mon', latitude: 35.1689, longitude: -5.2636, description: 'La perle bleue du Rif', climat: 'Méditerranéen d\'altitude', hebergement: 'Chaouen Guest Houses', icone: '💙' },
    { slug: 'essaouira', nom: 'Essaouira', region: 'Marrakech-Safi', type_touristique: 'cot', latitude: 31.5125, longitude: -9.7700, description: 'Cité des vents, haut lieu de la culture gnawa', climat: 'Venteux · Douceur constante', hebergement: 'Riads d\'artistes, Hôtels', icone: '🎸' },
    { slug: 'ouarzazate', nom: 'Ouarzazate', region: 'Drâa-Tafilalet', type_touristique: 'des', latitude: 30.9189, longitude: -6.8931, description: 'Hollywood africain, porte du désert', climat: 'Désertique · Aride', hebergement: 'Kasbahs, Hôtels de charme', icone: '🏰' },
    { slug: 'rabat', nom: 'Rabat', region: 'Rabat-Salé-Kénitra', type_touristique: 'cot', latitude: 34.0209, longitude: -6.8416, description: 'Capitale administrative du Maroc', climat: 'Tempéré · Océanique', hebergement: 'Hôtels modernes, Riads', icone: '🗼' },
    { slug: 'tanger', nom: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma', type_touristique: 'cot', latitude: 35.7595, longitude: -5.8340, description: 'La porte de l\'Afrique, ville du détroit', climat: 'Méditerranéen doux', hebergement: 'Hôtels, Riads modernes', icone: '⚓' },
    { slug: 'dades', nom: 'Vallée du Dadès', region: 'Drâa-Tafilalet', type_touristique: 'mon', latitude: 31.5231, longitude: -5.9209, description: 'Vallée des roses et gorges spectaculaires', climat: 'Semi-aride d\'altitude', hebergement: 'Kasbahs, Gîtes', icone: '🌹' },
  ];

  for (const d of destinations) {
    insertDest.run(d);
  }

  const insertActivity = db.prepare(`
    INSERT INTO activities (titre, description, prix, categorie, destination_slug, ville)
    VALUES (@titre, @description, @prix, @categorie, @destination_slug, @ville)
  `);

  const activities = [
    { titre: 'Médina & Jemaa el-Fna', description: 'La place magique la plus animée du monde. Conteurs, musiciens, cuisiniers de rue — un spectacle vivant à chaque heure.', prix: 450, categorie: 'Culture', destination_slug: 'marrakech', ville: 'Marrakech' },
    { titre: 'Atelier Cuisine dans un Riad', description: 'Tajine authentique, pastilla au poulet et bastilla sucrée avec un chef marrakchi dans un riad du XVIIe siècle.', prix: 550, categorie: 'Gastronomie', destination_slug: 'marrakech', ville: 'Marrakech' },
    { titre: 'Jardin Majorelle & YSL', description: 'Promenade dans le jardin bleu cobalt de Jacques Majorelle, racheté par Yves Saint Laurent. Un havre de paix.', prix: 250, categorie: 'Nature', destination_slug: 'marrakech', ville: 'Marrakech' },
    { titre: 'Hammam Royal Traditionnel', description: 'Rituel complet au savon beldi, ghassoul de l\'Atlas et massage à l\'huile d\'argan dans un hammam historique.', prix: 350, categorie: 'Bien-être', destination_slug: 'marrakech', ville: 'Marrakech' },
    { titre: 'Médina de Fès el-Bali', description: 'Labyrinthe de 9 000 ruelles. Tanneries Chouara, madrasa Bou Inania, fondouks médiévaux. UNESCO depuis 1981.', prix: 400, categorie: 'Culture', destination_slug: 'fes', ville: 'Fès' },
    { titre: 'Université al-Qarawiyyin', description: 'Fondée en 859, la plus ancienne université du monde toujours en activité. Bibliothèque de manuscrits rares.', prix: 200, categorie: 'Histoire', destination_slug: 'fes', ville: 'Fès' },
    { titre: 'Atelier Zellij & Poterie', description: 'Initiation à l\'art du zellij avec un maître artisan. Façonnage, émaillage et cuisson dans un four traditionnel.', prix: 480, categorie: 'Artisanat', destination_slug: 'fes', ville: 'Fès' },
    { titre: 'Bivouac Erg Chebbi', description: 'Nuit sous les étoiles dans les dunes de 150m. Dîner au feu de bois, musique touarègue et lever du soleil inoubliable.', prix: 1200, categorie: 'Désert', destination_slug: 'merzouga', ville: 'Merzouga' },
    { titre: 'Lever du Soleil en Dromadaire', description: 'Caravane au crépuscule sur les dunes silencieuses. Le silence du Sahara au moment où le ciel vire à l\'or.', prix: 600, categorie: 'Aventure', destination_slug: 'merzouga', ville: 'Merzouga' },
    { titre: 'Quad & 4×4 Sahara', description: 'Excursion motorisée dans les dunes et les villages nomades d\'Erg Chebbi. Adrénaline et liberté.', prix: 750, categorie: 'Désert', destination_slug: 'merzouga', ville: 'Merzouga' },
    { titre: 'Surf à Taghazout', description: 'Village de pêcheurs et spot de surf mythique. Cours débutants et sessions avancées sur Anchor Point et Hash Point.', prix: 650, categorie: 'Surf', destination_slug: 'agadir', ville: 'Agadir & Côte' },
    { titre: 'Croisière & Observation Dauphins', description: 'Sortie en mer au départ du port d\'Agadir. Observation des dauphins sauvages et des oiseaux marins.', prix: 500, categorie: 'Mer', destination_slug: 'agadir', ville: 'Agadir & Côte' },
    { titre: 'Ascension du Toubkal', description: 'Point culminant d\'Afrique du Nord à 4 167 m. 2 jours de trek avec nuit en refuge, guides berbères et panorama exceptionnel.', prix: 850, categorie: 'Trek', destination_slug: 'atlas', ville: 'Haut Atlas' },
    { titre: 'Immersion Imlil Berbère', description: 'Séjour dans un gîte berbère à Imlil. Repas avec une famille, tissage traditionnel et balade dans les vergers.', prix: 380, categorie: 'Culture', destination_slug: 'atlas', ville: 'Haut Atlas' },
    { titre: 'La Ville Bleue', description: 'Ruelles indigo et blanc, Ras el-Ma, Grande Mosquée. Photographiez chaque angle de ce village de conte de fées rifain.', prix: 200, categorie: 'Culture', destination_slug: 'chefchaouen', ville: 'Chefchaouen' },
    { titre: 'Forêt de Cèdres Talassemtane', description: 'Randonnée dans la réserve naturelle du Parc National de Talassemtane. Cèdres centenaires et sources cristallines.', prix: 420, categorie: 'Nature', destination_slug: 'chefchaouen', ville: 'Chefchaouen' },
    { titre: 'Culture Gnawa d\'Essaouira', description: 'Initiation à la musique spirituelle gnawa, visite du musée Sidi Mohammed Ben Abdallah et des luthiers de la médina.', prix: 280, categorie: 'Musique', destination_slug: 'essaouira', ville: 'Essaouira' },
    { titre: 'Kitesurf sur l\'Atlantique', description: 'Capitale mondiale du vent, Essaouira offre des conditions idéales pour le kitesurf et le windsurf toute l\'année.', prix: 700, categorie: 'Sport', destination_slug: 'essaouira', ville: 'Essaouira' },
    { titre: 'Coopérative d\'Huile d\'Argan', description: 'Rencontre des femmes artisanes, démonstration du pressage traditionnel et dégustation de l\'or liquide du Maroc.', prix: 180, categorie: 'Nature', destination_slug: 'essaouira', ville: 'Essaouira' },
    { titre: 'Aït Benhaddou au Coucher du Soleil', description: 'Ksar fortifié dans la lumière dorée du soir. Décor de Gladiator, Game of Thrones et Lawrence d\'Arabie.', prix: 350, categorie: 'UNESCO', destination_slug: 'ouarzazate', ville: 'Ouarzazate' },
    { titre: 'Studios Atlas Corporation', description: 'Coulisses de centaines de productions hollywoodiennes. Décors grandeur nature de films épiques. Ouarzazate, Hollywood africain.', prix: 250, categorie: 'Cinéma', destination_slug: 'ouarzazate', ville: 'Ouarzazate' },
    { titre: 'Tour Hassan & Mausolée', description: 'Minaret inachevé du XIIe siècle et chef-d\'œuvre de l\'art hispano-mauresque. Gardés par la garde royale à cheval.', prix: 150, categorie: 'Histoire', destination_slug: 'rabat', ville: 'Rabat' },
    { titre: 'Kasbah des Oudaias', description: 'Kasbah almohade dominant l\'Atlantique. Rues bleues et blanches, jardins andalous et musée berbère.', prix: 120, categorie: 'UNESCO', destination_slug: 'rabat', ville: 'Rabat' },
    { titre: 'Cap Spartel & Grottes d\'Hercule', description: 'Là où se rencontrent l\'Atlantique et la Méditerranée. Grottes préhistoriques habitées depuis 200 000 ans.', prix: 200, categorie: 'Nature', destination_slug: 'tanger', ville: 'Tanger' },
    { titre: 'Vallée des Roses de Kelaat', description: 'Explosion de parfums en mai. Champs de roses de Damas, coopérative de distillation et eau de rose artisanale.', prix: 280, categorie: 'Nature', destination_slug: 'dades', ville: 'Vallée Dadès' },
    { titre: 'Gorges du Todra — Escalade', description: 'Falaises verticales de 300m dans un canyon spectaculaire. Escalade, randonnée et bivouac au pied des parois.', prix: 450, categorie: 'Aventure', destination_slug: 'dades', ville: 'Vallée Dadès' },
  ];

  for (const a of activities) {
    insertActivity.run(a);
  }

  const insertGuide = db.prepare(`
    INSERT INTO guides (nom, prenom, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp)
    VALUES (@nom, @prenom, @ville, @telephone, @langues, @specialite, @description, @instagram, @linkedin, @whatsapp)
  `);

  const guides = [
    { nom: 'El Fassi', prenom: 'Youssef', ville: 'Fès', telephone: '+212661000001', langues: 'AR,FR,EN', specialite: 'Médinas et architecture andalouse', description: 'Expert en médinas et architecture andalouse. 12 ans dans les dédales de Fès el-Bali, il connaît chaque fondouk et chaque artisan.', instagram: 'https://instagram.com/guide.youssef', linkedin: 'https://linkedin.com/in/youssef-elfassi', whatsapp: '+212661000001' },
    { nom: 'Amrani', prenom: 'Fatima', ville: 'Marrakech', telephone: '+212661000002', langues: 'AR,FR,ES,IT', specialite: 'Artisanat et gastronomie', description: 'Marrakchie de souche, spécialiste artisanat et gastronomie. Elle vous fera toucher l\'âme de la cité ocre.', instagram: 'https://instagram.com/fatima.guide', linkedin: 'https://linkedin.com/in/fatima-amrani', whatsapp: '+212661000002' },
    { nom: 'Ait Bella', prenom: 'Hassan', ville: 'Ouarzazate', telephone: '+212661000003', langues: 'AR,TZ,FR,EN', specialite: 'Cinéma et désert', description: 'Guide officiel des productions Hollywood. Expert Aït Benhaddou, kasbahs et désert. 15 ans dans le Sud profond.', instagram: 'https://instagram.com/hassan.desert', linkedin: 'https://linkedin.com/in/hassan-aitbella', whatsapp: '+212661000003' },
    { nom: 'Bensouda', prenom: 'Nadia', ville: 'Essaouira', telephone: '+212661000004', langues: 'AR,FR,DE', specialite: 'Art gnawa et culture judéo-marocaine', description: 'Passionnée d\'art gnawa et de culture judéo-marocaine. Elle raconte Essaouira comme un roman vivant.', instagram: 'https://instagram.com/nadia.essaouira', linkedin: 'https://linkedin.com/in/nadia-bensouda', whatsapp: '+212661000004' },
    { nom: 'Benali', prenom: 'Omar', ville: 'Chefchaouen', telephone: '+212661000005', langues: 'AR,FR,EN,ES', specialite: 'Rif et Talassemtane', description: 'Fils du Rif, spécialiste Chefchaouen et Talassemtane. Il connaît chaque sentier de montagne de la région.', instagram: 'https://instagram.com/omar.rif', linkedin: 'https://linkedin.com/in/omar-benali', whatsapp: '+212661000005' },
    { nom: 'Tazi', prenom: 'Aicha', ville: 'Rabat', telephone: '+212661000006', langues: 'AR,FR,EN', specialite: 'Patrimoine impérial', description: 'Historienne et guide officielle du patrimoine impérial. Rabat, Salé et Chellah n\'ont aucun secret pour elle.', instagram: 'https://instagram.com/aicha.patrimoine', linkedin: 'https://linkedin.com/in/aicha-tazi', whatsapp: '+212661000006' },
    { nom: 'Ouhssain', prenom: 'Brahim', ville: 'Merzouga', telephone: '+212661000007', langues: 'AR,TZ,FR', specialite: 'Sahara et traditions touarègues', description: 'Né dans le Sahara, il guide depuis l\'enfance. Expert de l\'Erg Chebbi, des étoiles et des traditions touarègues.', instagram: 'https://instagram.com/brahim.sahara', linkedin: 'https://linkedin.com/in/brahim-ouhssain', whatsapp: '+212661000007' },
    { nom: 'Berrada', prenom: 'Khalid', ville: 'Tanger', telephone: '+212661000008', langues: 'AR,FR,EN,PT', specialite: 'Détroit et littérature Beat Generation', description: 'Expert du détroit et circuits littéraires Beat Generation. Tanger sous sa plume devient un roman à ciel ouvert.', instagram: 'https://instagram.com/khalid.tanger', linkedin: 'https://linkedin.com/in/khalid-berrada', whatsapp: '+212661000008' },
  ];

  for (const g of guides) {
    insertGuide.run(g);
  }

  const insertEval = db.prepare(`
    INSERT INTO evaluations (auteur_prenom, auteur_nom, commentaire, destination)
    VALUES (@auteur_prenom, @auteur_nom, @commentaire, @destination)
  `);

  const evaluations = [
    { auteur_prenom: 'Sofia', auteur_nom: 'Alami', commentaire: 'Le bivouac dans l\'Erg Chebbi est une expérience qui change une vie. La nuit sous les étoiles du Sahara, la musique gnawa au feu de bois… Je ne peux pas trouver les mots. TARGA m\'a orientée vers le guide parfait.', destination: 'Merzouga' },
    { auteur_prenom: 'Karim', auteur_nom: 'Mansouri', commentaire: 'Youssef El Fassi nous a fait vivre Fès el-Bali comme nulle part ailleurs. Il nous a emmené chez des artisans que les touristes ordinaires ne voient jamais. La Madrasa Bou Inania au coucher du soleil — magique.', destination: 'Fès' },
    { auteur_prenom: 'Laura', auteur_nom: 'Bertin', commentaire: 'Chefchaouen est un rêve éveillé. Le guide Omar nous a montré les ruelles secrètes que personne ne connaît et nous a invités à boire un thé chez des amis locaux. Expérience authentique et mémorable.', destination: 'Chefchaouen' },
  ];

  for (const e of evaluations) {
    insertEval.run(e);
  }
}

export default db;
