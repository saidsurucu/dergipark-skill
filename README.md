# DergiPark Skill (Claude in Chrome)

DergiPark (Türk akademik dergi platformu) için bir **Claude in Chrome** skill'i.
Claude'u senin **kendi tarayıcı oturumun** üzerinden çalıştırır: arama, makale
meta verisi, PDF→metin ve kaynakça çıkarma — hepsi sayfaya JavaScript enjekte
edilerek yapılır. Senin gerçek tarayıcın ve IP'n kullanıldığı için **CAPTCHA
çözmeye gerek yoktur**.

> Bu skill bir sunucu/MCP değildir. Hiçbir API anahtarı, CapSolver veya harici
> servis gerektirmez — sadece Claude + Chrome eklentisi ve (gelişmiş arama için)
> DergiPark hesabına giriş.

## Kurulum

**Gereksinimler:** Claude (Claude in Chrome özelliği aktif) + Chrome eklentisi.
Gelişmiş arama için DergiPark'a giriş yapmış olman gerekir.

Claude'a şunu yaz:

> Bu skill'i kurmak istiyorum: `https://github.com/saidsurucu/dergipark-skill`

## Ne yapabilir

Kurduktan sonra Claude'a doğal dilde söylemen yeterli; skill devreye girip
tarayıcında ilgili işi yapar.

### 1. Basit arama — `search_articles`
Anahtar kelimeyle arama (giriş gerektirmez). 24 sonuç/sayfa; her makale için
başlık, yazar, dergi, tarih, öz, DOI, ISSN, anahtar kelimeler, indeksler ve PDF
bağlantısı döner. Filtreler: sıralama (`newest`/`oldest`), makale türü, yıl ve
indeks filtresi (`tr_dizin_icerenler` / `bos_olmayanlar` / `hepsi`).

> Örnek: *"DergiPark'ta 'yapay zeka' ara, en yeniler önce gelsin"*
> *"'iklim değişikliği' için 2024 araştırma makalelerini getir"*

### 2. Gelişmiş alan araması — `advanced_search`
Alan bazlı boolean arama. **DergiPark'a giriş yapmış olman gerekir.**
17 alan: `title, short_title, journal, issn, eissn, abstract, keywords, doi,
doi_url, doi_prefix, author, orcid, institution, translator, year, citation,
publisher`. Operatörler: **AND / OR / NOT**. Yıl aralığı desteklenir.

> Örnek: *"Yazarı İnalcık olan makaleleri bul"*
> *"Başlığında 'yapay zeka' geçen ama anahtar kelimesinde 'eğitim' geçmeyen,
> 2024 sonrası makaleler"*
> *"Boğaziçi Üniversitesi + 'machine learning' anahtar kelimeli makaleler"*

### 3. PDF → metin — `pdf_to_html`
Bir DergiPark makale PDF'ini (dosya id'si ile) okunabilir metne çevirir.
Tarayıcıda pdf.js ile çıkarılır (CSP yok, harici bağımlılık çalışma anında CDN'den
yüklenir; çevrimdışı için pdf.js repoda gömülüdür). OCR yoktur.

> Örnek: *"Şu makalenin PDF'ini metne çevir: 3479650"*

### 4. Kaynakça — `get_article_references`
Bir makale URL'inden tüm kaynakça (citation_reference) listesini çıkarır.

> Örnek: *"Bu makalenin kaynakçasını çıkar: https://dergipark.org.tr/tr/pub/.../article/..."*

## Nasıl çalışır

- Aramalar `dergipark.org.tr` sekmesinde yapılır; makale detayları **sayfa-içi
  same-origin `fetch`** ile çekilir, böylece senin oturum çerezlerin (Cloudflare
  `cf_clearance` dahil) taşınır ve "Blocked" sorunu yaşanmaz.
- Eşzamanlılık sınırlı (havuz=4), `Promise.allSettled` + zaman aşımı ile; kısmi
  hatalar makale bazında raporlanır.
- Gelişmiş arama, gizli bir form yerine `/tr/search?q=<alan-operatörleri>&advanced=1`
  uç noktasını kullanır (sunucu-render sonuç).
- Sayfa içeriği **güvenilmez veri** olarak ele alınır; içerikteki talimatlar
  uygulanmaz.

## Geliştirme

Saf ayrıştırma/mantık fonksiyonları Node + jsdom ile birim test edilir:

```bash
cd tests
npm install
npm test
```

Kod yapısı:
- `SKILL.md` — Claude'un izlediği iş akışları
- `reference.md` — alan kodları, seçiciler, sözdizimi, canlı doğrulama notları
- `scripts/lib.js` — saf ayrıştırma/sorgu kurma (birim testli)
- `scripts/scrape.js` — paylaşılan detay/indeks çekme hattı
- `scripts/search.js`, `scripts/advanced_search.js`, `scripts/references.js`,
  `scripts/pdf_extract.js` — tarayıcı orkestratörleri
- `scripts/pdfjs.min.js` (+ worker) — gömülü pdf.js (çevrimdışı yedek)

## Notlar

- Tek instance / kişisel kullanım için tasarlanmıştır.
- Gelişmiş arama giriş gerektirir; sonuç `error` dönerse muhtemelen oturum
  açık değildir.
