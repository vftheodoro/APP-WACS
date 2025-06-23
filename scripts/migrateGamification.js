const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../src/services/firebase/serviceAccountKey.json');
const XP_RULES = {
  review: { xp: 10, dailyLimit: 20 },
  add_location: { xp: 30, dailyLimit: 5 },
  add_photo: { xp: 15, dailyLimit: 20 },
  verify_info: { xp: 20, dailyLimit: 10 },
  report_error: { xp: 5, dailyLimit: 20 },
};
const LEVELS = [0, 100, 300, 600, 1200, 2500, 5000, 999999];
const BADGES = [
  { key: 'primeiros_passos', check: (xp) => xp >= 50 },
  { key: 'fotografo', check: (photos) => photos >= 10 },
  { key: 'mestre_avaliador', check: (reviews) => reviews >= 100 },
  { key: 'detetive', check: (reports) => reports >= 50 },
];

initializeApp({
  credential: applicationDefault(),
  // Se necessário, adicione databaseURL
});
const db = getFirestore();

async function migrate() {
  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    let xp = 0;
    let streak = 0;
    let badges = [];
    // Buscar reviews
    const reviewsSnap = await db.collectionGroup('reviews').where('user.id', '==', userId).get();
    const reviews = reviewsSnap.docs;
    xp += reviews.length * XP_RULES.review.xp;
    // Buscar locais
    const locationsSnap = await db.collection('locations').where('author.id', '==', userId).get();
    const locations = locationsSnap.docs;
    xp += locations.length * XP_RULES.add_location.xp;
    // Fotos (se houver subcoleção photos)
    let photos = 0;
    try {
      const photosSnap = await db.collectionGroup('photos').where('userId', '==', userId).get();
      photos = photosSnap.size;
      xp += photos * XP_RULES.add_photo.xp;
    } catch {}
    // Reports (se houver subcoleção reports)
    let reports = 0;
    try {
      const reportsSnap = await db.collectionGroup('reports').where('userId', '==', userId).get();
      reports = reportsSnap.size;
      xp += reports * XP_RULES.report_error.xp;
    } catch {}
    // Streak (simplificado: dias distintos de review)
    let streakDays = new Set();
    for (const r of reviews) {
      const date = r.data().createdAt?.toDate?.() || r.data().createdAt;
      if (date) streakDays.add(new Date(date).toISOString().slice(0, 10));
    }
    streak = streakDays.size;
    // Badges
    BADGES.forEach(b => {
      if (b.check({ xp, photos, reviews: reviews.length, reports })) badges.push(b.key);
    });
    // Nível
    let level = 1;
    for (let i = 1; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i]) level = i + 1;
      else break;
    }
    // Atualizar usuário
    await db.collection('users').doc(userId).update({
      xp,
      level,
      badges,
      streak,
    });
    console.log(`Usuário ${userId} migrado: XP=${xp}, Nível=${level}, Badges=${badges.join(',')}, Streak=${streak}`);
  }
  console.log('Migração concluída!');
}

migrate().catch(console.error); 