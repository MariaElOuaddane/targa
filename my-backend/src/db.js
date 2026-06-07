import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
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
    { auteur_prenom: 'Thomas', auteur_nom: 'Leroy', commentaire: 'Le surf à Taghazout avec TARGA était incroyable ! Les vagues étaient parfaites et le guide local connaissait les meilleurs spots. Je recommande à 100%, je reviendrai l\'année prochaine.', destination: 'Agadir' },
    { auteur_prenom: 'Aïcha', auteur_nom: 'Benkirane', commentaire: 'L\'atelier cuisine à Marrakech était sublime. Nous avons appris à faire la pastilla et le tajine comme ma grand-mère. Le chef était passionné et patient. Une expérience culturelle autant que gustative.', destination: 'Marrakech' },
    { auteur_prenom: 'Pierre', auteur_nom: 'Moreau', commentaire: 'L\'ascension du Toubkal restera gravée dans ma mémoire. Le guide Brahim était incroyablement professionnel et motivant. Le lever du soleil à 4167 m — indescriptible.', destination: 'Haut Atlas' },
    { auteur_prenom: 'Nadia', auteur_nom: 'Fassi', commentaire: 'Le hammam royal à Fès était divin. Pure détente, soins traditionnels à l\'huile d\'argan, le tout dans un cadre historique magnifiquement restauré. Un voyage sensoriel inoubliable.', destination: 'Fès' },
    { auteur_prenom: 'Julien', auteur_nom: 'Dupont', commentaire: 'Les gorges du Todra pour l\'escalade, c\'est le paradis ! Les voies sont magnifiques, le canyon grandiose. Merci à TARGA pour l\'organisation au top et le guide passionné.', destination: 'Vallée du Dadès' },
    { auteur_prenom: 'Fatima', auteur_nom: 'Zahra', commentaire: 'La visite d\'Aït Benhaddou au coucher du soleil était tout simplement magique. Le ksar prend des teintes dorées incroyables. Le guide Hassan nous a raconté l\'histoire avec une passion contagieuse.', destination: 'Ouarzazate' },
    { auteur_prenom: 'Claire', auteur_nom: 'Petit', commentaire: 'Essaouira est un bijou. La culture gnawa m\'a fascinée, les ruelles bleues et blanches sont photogéniques à chaque coin. Le vent est permanent mais ça fait partie du charme !', destination: 'Essaouira' },
    { auteur_prenom: 'Mehdi', auteur_nom: 'Ouazzani', commentaire: 'Le quad dans le Sahara était une aventure de folie ! Les dunes immenses à perte de vue, le coucher du soleil orange et rouge. Nos guides étaient super sympas et professionnels.', destination: 'Merzouga' },
    { auteur_prenom: 'Sarah', auteur_nom: 'Cohen', commentaire: 'La médina de Marrakech est un véritable labyrinthe magique. Grâce au guide, nous avons découvert des endroits cachés incroyables. Mention spéciale pour le Jardin Majorelle — un oasis de paix.', destination: 'Marrakech' },
    { auteur_prenom: 'Youssef', auteur_nom: 'Idrissi', commentaire: 'Le kitesurf à Essaouira était sensationnel ! Le vent est parfait, les moniteurs qualifiés, et l\'ambiance dans la ville est géniale. Je recommande la période mai-juin.', destination: 'Essaouira' },
    { auteur_prenom: 'Marie', auteur_nom: 'Laurent', commentaire: 'Tanger est magnifique ! Le Cap Spartel et les Grottes d\'Hercule sont à voir absolument. Le guide Khalid connaît des anecdotes passionnantes sur la Beat Generation.', destination: 'Tanger' },
    { auteur_prenom: 'Rachid', auteur_nom: 'El Ouafi', commentaire: 'Circuit gastronomique incroyable à Marrakech. De la place Jemaa el-Fna aux riads cachés, chaque étape était une explosion de saveurs. Un grand merci à TARGA pour cette expérience.', destination: 'Marrakech' },
    { auteur_prenom: 'Camille', auteur_nom: 'Roux', commentaire: 'La nuit à Erg Chebbi est l\'une des plus belles nuits de ma vie. Le ciel étoilé dans le désert, le dîner berbère traditionnel, la musique autour du feu… Un moment suspendu hors du temps.', destination: 'Merzouga' },
    { auteur_prenom: 'Hassan', auteur_nom: 'Bennis', commentaire: 'Rabat est une ville pleine de surprises. La Kasbah des Oudaias est magnifique, le mausolée Mohammed V impressionnant. Un beau mélange d\'histoire et de modernité.', destination: 'Rabat' },
    { auteur_prenom: 'Emma', auteur_nom: 'Schmidt', commentaire: 'La Vallée des Roses en mai est un spectacle pour les sens. Les champs infinis de roses de Damas, les coopératives de femmes qui distillent l\'eau de rose. Authentique et émouvant.', destination: 'Vallée du Dadès' },
    { auteur_prenom: 'Omar', auteur_nom: 'Ghali', commentaire: 'L\'immersion berbère à Imlil était exactement ce que je cherchais. Partager un repas avec une famille locale, comprendre leur quotidien, leurs traditions. Le tourisme responsable à son meilleur.', destination: 'Haut Atlas' },
    { auteur_prenom: 'Sophie', auteur_nom: 'Bernard', commentaire: 'La visite des studios de Ouarzazate est passionnante même pour qui n\'est pas cinéphile. Voir les décors de Gladiator et Game of Thrones en vrai, c\'est impressionnant. Notre guide était un puits de science.', destination: 'Ouarzazate' },
    { auteur_prenom: 'Kenza', auteur_nom: 'Mouline', commentaire: 'La coopérative d\'argan à Essaouira était enrichissante. Les femmes expliquent leur travail avec fierté. L\'huile d\'argan bio que j\'ai rapportée est excellente. Belle initiative solidaire.', destination: 'Essaouira' },
    { auteur_prenom: 'Alexandre', auteur_nom: 'Caron', commentaire: 'Forêt de cèdres de Talassemtane — un véritable bol d\'air pur. Les cèdres centenaires imposants, les sources d\'eau cristalline. Le guide Omar connaît la région comme sa poche.', destination: 'Chefchaouen' },
    { auteur_prenom: 'Nour', auteur_nom: 'Eddine', commentaire: 'Le musée Yves Saint Laurent et le Jardin Majorelle sont un must à Marrakech. Même si vous n\'êtes pas mode, l\'histoire du lieu et le bleu Majorelle valent le détour.', destination: 'Marrakech' },
    { auteur_prenom: 'Isabelle', auteur_nom: 'Garnier', commentaire: 'L\'atelier de poterie à Fès était très amusant ! Le maître artisan nous a appris les bases du tournage. Repartir avec son propre bol fait main est une fierté. Super activité en famille.', destination: 'Fès' },
    { auteur_prenom: 'Adil', auteur_nom: 'Chraibi', commentaire: 'Wind surf à Essaouira — les conditions sont idéales pour progresser. Les moniteurs sont patients et pédagogues. L\'ambiance dans la ville est décontractée et cosmopolite.', destination: 'Essaouira' },
  ];

  for (const e of evaluations) {
    insertEval.run(e);
  }

  // --- seed users ---
  const hash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare('INSERT INTO users (prenom, nom, email, password, role) VALUES (?,?,?,?,?)');
  const users = [
    ['Admin','TARGA','admin@targa.ma',hash,'admin'],
    ['Sophie','Martin','sophie@test.ma',hash,'user'],
    ['Marc','Dubois','marc@test.ma',hash,'user'],
    ['Leila','Benali','leila@test.ma',hash,'user'],
    ['Amine','Tazi','amine@test.ma',hash,'user'],
    ['Yasmine','El Fassi','yasmine@test.ma',hash,'user'],
  ];
  for (const u of users) { insertUser.run(...u); }

  // --- seed guide_ratings ---
  const insertGR = db.prepare('INSERT INTO guide_ratings (user_id, guide_id, rating) VALUES (?,?,?)');
  const guideRatings = [
    [2,1,5],[3,1,4],[4,1,5],[5,1,5],[6,1,4],
    [2,2,5],[3,2,5],[4,2,4],[5,2,5],
    [2,3,5],[3,3,5],[4,3,5],
    [2,4,4],[3,4,5],[4,4,4],
    [2,5,5],[3,5,5],[5,5,4],
    [2,6,4],[3,6,4],
    [2,7,5],[3,7,5],[4,7,5],[5,7,5],[6,7,5],
    [2,8,4],[3,8,5],[4,8,4],
  ];
  for (const r of guideRatings) { insertGR.run(...r); }

  // --- seed activity_ratings ---
  const insertAR = db.prepare('INSERT INTO activity_ratings (user_id, activity_id, rating) VALUES (?,?,?)');
  const actRatings = [
    [2,1,5],[3,1,4],[4,1,5],[5,1,5],
    [2,2,5],[3,2,4],[4,2,5],
    [2,3,4],[3,3,4],[5,3,5],
    [2,4,5],[4,4,5],[6,4,4],
    [2,5,5],[3,5,5],[4,5,5],[5,5,5],
    [2,6,4],[3,6,4],[5,6,4],
    [2,8,5],[3,8,5],[4,8,5],[5,8,5],[6,8,5],
    [2,11,5],[3,11,5],[4,11,5],
    [2,13,4],[3,13,5],[5,13,5],
    [2,14,4],[4,14,4],[6,14,4],
    [2,18,5],[3,18,5],[4,18,5],
    [2,20,5],[3,20,4],[5,20,5],
  ];
  for (const r of actRatings) { insertAR.run(...r); }

  // --- seed reservations ---
  const insertRes = db.prepare(`INSERT INTO reservations (activity_id, prenom, nom, email, telephone, date_reservation, nombre_personnes, statut, user_id)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  const reservations = [
    [1,'Sophie','Martin','sophie@test.ma','+33612345678','2026-07-15',2,'confirmé',2],
    [5,'Marc','Dubois','marc@test.ma','+33623456789','2026-07-20',3,'confirmé',3],
    [8,'Leila','Benali','leila@test.ma','+33634567890','2026-08-05',2,'confirmé',4],
    [11,'Amine','Tazi','amine@test.ma','+33645678901','2026-07-25',1,'confirmé',5],
    [13,'Yasmine','El Fassi','yasmine@test.ma','+33656789012','2026-08-12',4,'en_attente',6],
    [18,'Sophie','Martin','sophie@test.ma','+33612345678','2026-08-20',2,'en_attente',2],
    [20,'Marc','Dubois','marc@test.ma','+33623456789','2026-09-01',1,'annulé',3],
    [2,'Leila','Benali','leila@test.ma','+33634567890','2026-07-10',3,'confirmé',4],
  ];
  for (const r of reservations) { insertRes.run(...r); }
}

export default db;
