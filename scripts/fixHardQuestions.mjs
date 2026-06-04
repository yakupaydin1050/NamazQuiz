// Kullanım: ANTHROPIC_API_KEY=sk-... node scripts/fixHardQuestions.mjs
import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from "firebase/firestore";

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

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("Hata: ANTHROPIC_API_KEY ortam değişkeni tanımlı değil.");
  process.exit(1);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function generateWrongOptions(question, correctAnswer) {
  const targetLen = correctAnswer.length;
  const min = Math.max(8, Math.round(targetLen * 0.75));
  const max = Math.round(targetLen * 1.25);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Aşağıdaki İslami namaz bilgisi sorusu için 3 adet YANLIŞ şık üret.

Soru: ${question}
Doğru cevap: ${correctAnswer} (${targetLen} karakter)

Kurallar:
- Her yanlış şık ${min}-${max} karakter arasında olsun (doğru cevapla benzer uzunluk)
- Şıklar dini terminoloji açısından makul görünsün ama kesinlikle yanlış olsun
- Türkçe yaz
- Sadece JSON array döndür, başka hiçbir şey yazma

Örnek format: ["yanlış şık 1", "yanlış şık 2", "yanlış şık 3"]`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API hatası ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // JSON array parse et
  const match = text.match(/\[.*\]/s);
  if (!match) throw new Error(`Geçersiz API yanıtı: ${text}`);
  return JSON.parse(match[0]);
}

async function main() {
  console.log("Zor sorular çekiliyor...");
  const snapshot = await getDocs(
    query(collection(db, "questions"), where("level", "==", "hard"))
  );

  const problematic = [];
  snapshot.forEach((d) => {
    const data = d.data();
    const maxLen = Math.max(...data.options.map((o) => o.length));
    if (data.correct.length === maxLen) {
      problematic.push({ id: d.id, ...data });
    }
  });

  console.log(
    `${snapshot.size} zor soru içinden ${problematic.length} tanesinde doğru cevap en uzun şık.`
  );

  if (problematic.length === 0) {
    console.log("Düzeltilecek soru yok.");
    process.exit(0);
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < problematic.length; i++) {
    const q = problematic[i];
    console.log(`\n[${i + 1}/${problematic.length}] İşleniyor...`);
    console.log(`  Soru: ${q.question.slice(0, 70)}${q.question.length > 70 ? "..." : ""}`);
    console.log(`  Doğru cevap: ${q.correct}`);

    try {
      const newWrong = await generateWrongOptions(q.question, q.correct);
      const newOptions = shuffle([q.correct, ...newWrong]);

      await updateDoc(doc(db, "questions", q.id), { options: newOptions });

      console.log(`  ✅ Güncellendi. Yeni şıklar: ${newOptions.join(" | ")}`);
      success++;
    } catch (e) {
      console.error(`  ❌ Hata: ${e.message}`);
      failed++;
    }

    // Rate limit önlemi
    if (i < problematic.length - 1) await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n--- Tamamlandı ---`);
  console.log(`Başarılı: ${success} | Hatalı: ${failed}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Beklenmeyen hata:", e);
  process.exit(1);
});
