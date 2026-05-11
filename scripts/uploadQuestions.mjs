// Kullanım: node scripts/uploadQuestions.mjs
import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, writeBatch } from "firebase/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const questions = require("../data/questions.json");

const firebaseConfig = {
  apiKey: "AIzaSyAD93bsulR1ftPBS3bjIsUyRDgPGmKefNw",
  authDomain: "namaz-quiz.firebaseapp.com",
  projectId: "namaz-quiz",
  storageBucket: "namaz-quiz.firebasestorage.app",
  messagingSenderId: "75178436017",
  appId: "1:75178436017:web:0b06e7232e6a419d270990",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BATCH_SIZE = 499;

async function upload() {
  console.log(`📚 ${questions.length} soru yüklenecek...\n`);

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const chunk = questions.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((q) => {
      // id alanını Firestore döküman ID'si olarak kullan — tekrar çalıştırma güvenli
      const ref = doc(collection(db, "questions"), String(q.id));
      batch.set(ref, q);
    });

    await batch.commit();
    console.log(`✓ ${Math.min(i + BATCH_SIZE, questions.length)}/${questions.length} soru yüklendi`);
  }

  console.log("\n✅ Tüm sorular Firestore'a başarıyla yüklendi!");
  process.exit(0);
}

upload().catch((err) => {
  console.error("❌ Hata:", err.message);
  process.exit(1);
});
