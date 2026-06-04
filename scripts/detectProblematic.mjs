// node scripts/detectProblematic.mjs
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { writeFileSync } from "fs";

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

const snapshot = await getDocs(
  query(collection(db, "questions"), where("level", "==", "hard"))
);

const problematic = [];
snapshot.forEach((d) => {
  const data = d.data();
  const maxLen = Math.max(...data.options.map((o) => o.length));
  if (data.correct.length === maxLen) {
    problematic.push({ id: d.id, question: data.question, correct: data.correct, options: data.options });
  }
});

console.log(`Toplam zor soru: ${snapshot.size}`);
console.log(`Sorunlu (doğru = en uzun): ${problematic.length}`);

writeFileSync("scripts/problematic.json", JSON.stringify(problematic, null, 2), "utf8");
console.log("scripts/problematic.json dosyasına kaydedildi.");
process.exit(0);
