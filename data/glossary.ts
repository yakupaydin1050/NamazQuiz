export type GlossaryEntry = {
  term: string;
  definition: string;
};

// Normalize: lowercase (TR-aware), remove diacritics â/î/û, strip non-letter chars
export function normalize(word: string): string {
  return word
    .toLocaleLowerCase('tr')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-zçğışöü]/g, '');
}

const TERMS: Array<{ key: string } & GlossaryEntry> = [
  // Fıkhi hükümler
  { key: 'farz', term: 'Farz', definition: "Allah'ın kesin emriyle yapılması zorunlu olan ibadet. Terk edilmesi büyük günahtır." },
  { key: 'vacip', term: 'Vâcip', definition: "Farzdan sonra gelen bağlayıcı ibadet. Delili biraz daha zayıf olup özürsüz terk edilmesi günah sayılır." },
  { key: 'sunnet', term: 'Sünnet', definition: "Hz. Peygamber'in yapıp tavsiye ettiği ibadet. Terk edilmesi kınama gerektirir ama günah sayılmaz." },
  { key: 'nafile', term: 'Nâfile', definition: "Farz ve vâcip dışında isteğe bağlı kılınan ilave namaz. Kılmak sevap, terk etmek serbest." },
  { key: 'müstehap', term: 'Müstehap', definition: "Yapılması dinen güzel ve sevap olan, ama terk edilmesi kınama gerektirmeyen eylem." },
  { key: 'mendup', term: 'Mendup', definition: "Müstehap ile eş anlamlı; yapılması tavsiye edilen, terk edilmesi günah olmayan eylem." },
  { key: 'mekruh', term: 'Mekruh', definition: "Dinen hoş karşılanmayan, yapılması sakıncalı eylem. Harama yakın ama haram değil." },
  { key: 'mübah', term: 'Mübah', definition: "Yapılıp yapılmaması serbest olan; dinen ne sevap ne de günah sayılan eylem." },
  { key: 'haram', term: 'Haram', definition: "Allah'ın kesin olarak yasakladığı eylem. Yapılması günah sayılır." },
  // Namaz türleri
  { key: 'vitir', term: 'Vitir', definition: "Yatsı namazından sonra kılınan üç rekâtlık namaz. Hanefî mezhebine göre vâciptir." },
  { key: 'teravih', term: 'Teravih', definition: "Ramazan ayında yatsı namazından sonra cemaatle kılınan sünnet namaz." },
  { key: 'teheccüd', term: 'Teheccüd', definition: "Gece uyanılarak kılınan nâfile namaz; çok faziletlidir." },
  { key: 'kuşluk', term: 'Kuşluk (Duhâ)', definition: "Güneş iyice yükseldikten sonra, öğleden önce kılınan nâfile namaz." },
  // Arapça ibadet adları
  { key: 'salat', term: 'Salât', definition: "Namazın Arapça adı; dua ve ibadet anlamına gelir." },
  { key: 'savm', term: 'Savm', definition: "Orucun Arapça karşılığı." },
  { key: 'tilavet', term: 'Tilâvet', definition: "Kur'an-ı Kerîm'i usulünce ve tecvitle okumak." },
  // Zikir/dualar
  { key: 'tesbih', term: 'Tesbih', definition: '"Sübhanallah" demek; Allah\'ı her türlü eksiklikten tenzih etmek.' },
  { key: 'tahmid', term: 'Tahmid', definition: '"Elhamdülillah" demek; Allah\'a hamd ve şükür etmek.' },
  { key: 'tehlil', term: 'Tehlil', definition: '"Lâ ilâhe illallah" demek; Allah\'ın birliğini dile getiren zikir.' },
  { key: 'tekbir', term: 'Tekbir', definition: '"Allahu Ekber" demek; Allah\'ın en büyük olduğunu söylemek. Namaza tekbirle girilir.' },
  { key: 'kunut', term: 'Kunut', definition: "Vitir namazının son rekâtında rükûdan önce okunan özel dua." },
  // Taharet
  { key: 'taharet', term: 'Tahâret', definition: "Temizlik. Namaz için hem maddî (necasetten) hem manevî (hadesten) temizlik şarttır." },
  { key: 'necaset', term: 'Necâset', definition: "Dinen kirli sayılan pis madde (idrar, kan vb.). Namaza engel olur." },
  { key: 'hades', term: 'Hades', definition: "Abdest veya gusül gerektiren manevî kirlilik hali." },
  { key: 'abdest', term: 'Abdest', definition: "Namaz için yüz, eller, kollar, baş ve ayakları usulünce yıkamak." },
  { key: 'gusül', term: 'Gusül', definition: "Cünüplük, hayız veya nifas sonrası tüm vücudu yıkayarak yapılan büyük abdest." },
  { key: 'teyemmüm', term: 'Teyemmüm', definition: "Su bulunamadığında temiz toprakla yüz ve ellere dokunarak yapılan sembolik temizlik." },
  { key: 'istinca', term: 'İstinca', definition: "Tuvaletten sonra taş, bez veya su ile yapılan temizlik." },
  { key: 'istibra', term: 'İstibra', definition: "İdrar yolundaki son damlalardan temizlenmek için bekleme." },
  { key: 'cünüp', term: 'Cünüp', definition: "Gusül gerektiren kirlilik halinde olan kişi. Namaz kılamaz, Kur'an tutamaz." },
  { key: 'hayız', term: 'Hayız', definition: "Adet görme hali. Bu sürede namaz kılınmaz ve oruç tutulmaz." },
  { key: 'nifas', term: 'Nifas', definition: "Doğum sonrası kan akması hali. Bu sürede namaz kılınmaz." },
  // Namazın şartları / rükünleri
  { key: 'niyet', term: 'Niyet', definition: "Hangi namazı kılacağını kalben belirlemek. Esas olan kalbin kararıdır, dil ile söylemek zorunlu değildir." },
  { key: 'kıyam', term: 'Kıyam', definition: "Namazda dik durmak. Farz ve vâcip namazlarda rükündür (zorunludur)." },
  { key: 'kıraat', term: 'Kıraat', definition: "Namazda Kur'an-ı Kerîm okumak. İlk iki rekâtta rükündür." },
  { key: 'rüku', term: 'Rükû', definition: "Namazda elleri dizlere dayayarak sırtı yere paralel hale getirerek eğilmek." },
  { key: 'secde', term: 'Secde', definition: "Alın, burun, avuçlar, dizler ve ayak parmaklarını yere değdirerek kapanmak. Kulun Allah'a en yakın olduğu andır." },
  { key: 'kade', term: "Ka'de", definition: "Namazda oturmak. Son oturuş (ka'de-i ahîre) farzdır." },
  { key: 'kavme', term: 'Kavme', definition: "Rükûdan sonra tam olarak doğrulup ayağa kalkmak." },
  { key: 'celse', term: 'Celse', definition: "İki secde arasındaki kısa oturuş." },
  { key: 'selam', term: 'Selâm', definition: 'Namazı bitirmek için her iki yana "es-Selâmü aleyküm" demek. Hanefîlere göre vâciptir.' },
  { key: 'rükün', term: 'Rükün', definition: "Namazın temel parçası. Rükünlerden biri eksik olursa namaz geçersiz olur." },
  { key: 'tertip', term: 'Tertip', definition: "Namazın rükünlerini doğru sırayla yapmak." },
  { key: 'tadili', term: 'Tadil-i Erkân', definition: "Namazın rükünlerini hakkıyla ve yeterli süreyle yerine getirmek; acele etmemek." },
  // Namaza başlama / geçiş
  { key: 'iftitah', term: 'İftitah', definition: 'Namaza başlama. İftitah tekbiri, "Allahu Ekber" diyerek namaza girilmesi.' },
  { key: 'intikal', term: 'İntikal', definition: "Namazda bir rükünden diğerine geçiş sırasında alınan tekbir." },
  // Namaz şartları
  { key: 'taharri', term: 'Taharri', definition: "Kıble yönünü bilmeyenin araştırıp en doğru yönü belirlemeye çalışması." },
  { key: 'avret', term: 'Avret', definition: "Namazda ve genel hayatta örtülmesi gereken vücut bölgeleri." },
  // Vakit kavramları
  { key: 'imsak', term: 'İmsak', definition: "Sabah namazı vaktinin başlangıcı; ufukta yatay aydınlığın (fecr-i sâdık) belirdiği an." },
  { key: 'fecri', term: 'Fecr-i Sâdık', definition: "Gerçek sabah aydınlığı; sabah namazı ve orucun başlangıcını belirler." },
  // Özel kavramlar
  { key: 'mirac', term: 'Miraç', definition: "Hz. Peygamber'in Allah'ın huzuruna yükseltildiği kutsal gece. Beş vakit namaz bu gecede emredildi." },
  { key: 'kıble', term: 'Kıble', definition: "Mekke'deki Kâbe'nin yönü. Müslümanlar namaz kılarken bu yöne döner." },
  { key: 'kabe', term: 'Kâbe', definition: "Mekke'deki kübik kutsal yapı. Namazda yönelinen kıble noktasıdır." },
  { key: 'mihrap', term: 'Mihrap', definition: "Camide imamın öne geçtiği, kıble yönünü gösteren girintili bölüm." },
  { key: 'ezan', term: 'Ezan', definition: "Namaz vakitlerini bildiren ve Müslümanları namaza çağıran sesli ilan." },
  { key: 'ikamet', term: 'İkâmet / Kamet', definition: "Cemaatle namazdan hemen önce okunan kısa ezan benzeri çağrı." },
  { key: 'imam', term: 'İmam', definition: "Cemaate namaz kıldıran kişi; öne geçer ve cemaat ona uyar." },
  { key: 'cemaat', term: 'Cemaat', definition: "Namaz için bir araya gelen topluluk. Cemaatle kılmak büyük sevap getirir." },
  { key: 'kaza', term: 'Kaza', definition: "Vaktinde kılınamayan namazı daha sonra kılmak." },
  { key: 'iade', term: 'İade', definition: "Bozuk ya da eksik kılınan namazı yeniden kılmak." },
  { key: 'mezhep', term: 'Mezhep', definition: "İslam hukukunu yorumlayan dini ekol (Hanefi, Maliki, Şafii, Hanbeli)." },
  { key: 'hanefi', term: 'Hanefi', definition: "İmam Ebu Hanife'nin kurduğu fıkıh mezhebi. Türkiye'de en yaygın mezheptir." },
  { key: 'rekat', term: 'Rekât', definition: "Namazın kıyam, rükû, iki secde ve oturuştan oluşan bir tam döngüsü." },
  { key: 'nezir', term: 'Nezir / Adak', definition: "Belirli bir şey gerçekleşirse ibadet yapacağına dair Allah'a söz vermek." },
  { key: 'nezret', term: 'Nezir / Adak', definition: "Belirli bir şey gerçekleşirse ibadet yapacağına dair Allah'a söz vermek." },
  { key: 'istihare', term: 'İstihare', definition: "Önemli bir karar öncesinde Allah'tan hayırlısını dilemek için kılınan özel namaz." },
  { key: 'secdeisehiv', term: 'Secde-i Sehiv', definition: "Namazda yapılan yanılgıları telafi etmek için namazın sonunda yapılan iki ek secde." },
  { key: 'secdeitilav', term: 'Secde-i Tilâvet', definition: "Kur'an okurken veya dinlerken secde ayetine gelindiğinde yapılan secde." },
];

const _lookup = new Map<string, GlossaryEntry>();
for (const { key, term, definition } of TERMS) {
  _lookup.set(key, { term, definition });
}

export function findGlossaryEntry(word: string): GlossaryEntry | null {
  const norm = normalize(word);
  if (norm.length < 3) return null;

  // Exact match
  if (_lookup.has(norm)) return _lookup.get(norm)!;

  // Prefix match: normalized word begins with a glossary key (key must be ≥4 chars)
  for (const [key, entry] of _lookup) {
    if (key.length >= 4 && norm.startsWith(key)) return entry;
  }

  return null;
}
