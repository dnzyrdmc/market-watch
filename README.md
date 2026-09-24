# Canlı Piyasa İzleme Paneli

Simüle fiyat akışını, favorileri ve üst eşik alarmlarını bir arayüzde izle.

![Uygulama ekranı](docs/screenshot.png)

**Durum:** Çalıştırılabilir yerel temel sürüm (v0.1). Simüle fiyatlar · SSE akışı.

## Kurulum

Node.js 24.x ve npm gerekir. İlk kurulumda npm paketlerini indirmek için internet bağlantısı gerekir. Node 24 `node:sqlite` deneysel uyarısı yazabilir; bu uyarı tek başına hata değildir.

```bash
npm ci
npm run dev
```

Tarayıcı: http://localhost:3000. Giriş: **demo@example.com / Demo12345!**. İkinci hesap: **other@example.com / Demo12345!**.

İkinci terminalde, aynı proje klasöründe:

```bash
npm run seed
```

Seed komutu örnek kayıt ekler; tekrar çalıştırmak yeni örnek kayıtlar oluşturabilir. Bazı projelerde başlangıç kataloğu zaten hazırdır; seed bunu açıklar.

## Derleme ve test

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm run dev` sırasında değişiklikleri Vite işler. `npm start` için önce build gerekir. Testler RAM veritabanı ve rastgele portla çalışır; kendi verilerini oluşturur. Mevcut demo veritabanını değiştirmez. Typecheck TypeScript giriş/ortak bileşenlerini ve Vue şablonlarını kapsar; JavaScript backend'in tam tip doğrulaması değildir.

## Çalışan özellikler

- 3 varlık için iki saniyede bir fiyat
- Server-Sent Events yayını
- 100 noktalı SVG çizgi grafik
- Kullanıcıya özel favoriler
- Üst eşik geçişinde tek alarm

## Kapsam sınırı

Gerçek borsa/kripto API’si yok. Tek yönlü SSE kullanılır; WebSocket değildir. Her sunucu yeniden başlatıldığında fiyat simülatörü devam eder; gerçek piyasa geçmişi veya mum grafiği yok.

## Dosyalar ve akış

| Dosya | Sorumluluk |
| --- | --- |
| client/Workspace.vue | Projeye özel formlar, listeler, kullanıcı eylemleri |
| client/App.vue | Oturum açma ve ortak sayfa düzeni |
| client/api.ts | Fetch, hata mesajı, para/tarih yardımcıları |
| server/project.js | Alan kuralları, SQL sorguları ve API uçları |
| server/core.js | Veritabanı, doğrulama, oturum ve SSE yardımcıları |
| server/index.js | Express başlatma, güvenlik başlıkları ve statik dosyalar |
| schema.sql | Uygulamanın gerçek tablo/indeks şeması; referans amaçlı |
| tests/project.test.js | Gerçek HTTP istekleriyle kritik iş kuralları |
| scripts/seed.js | Örnek veri ekleme |
| PROJECT_DETAILS.pdf | Beş sayfalık proje açıklaması, API, test ve geliştirme rehberi |

Arayüz → aynı origin `/api` → oturum/sahiplik/doğrulama → iş kuralı → SQLite → JSON → görünüm. SQLite `data/app.sqlite` dosyasında kalıcıdır. Bu küçük uygulamalarda tablolar açılışta `CREATE TABLE IF NOT EXISTS` ile kurulur; sürümlü migration sistemi henüz yoktur.

## İş kuralı

Backend fiyat noktalarına artan seq verir. Arayüz eski sequence değerini işlemez. Alarm önceki fiyat eşik altında/eşit ve yeni fiyat eşik üstünde olduğunda tek kez tetiklenir, armed=0 olur. ticks tablosu son 1500 kayıtla sınırlandırılır. SSE oturum gerektirir; kişisel alarm yalnız sahibine gönderilir.

## API haritası

Oturum: `POST /api/auth/login` JSON `{"email":"demo@example.com","password":"Demo12345!"}`; `GET /api/auth/me`; `POST /api/auth/logout`. Çerez HttpOnly + SameSite=Strict. Tarayıcı aynı origin kullanır.

| Yöntem ve yol | Girdi | Başarı |
| --- | --- | --- |
| GET /api/market | Gövde yok | 200 |
| GET /api/prices/:symbol | Gövde yok | 200 |
| PUT /api/watch/:symbol | Gövde yok | 200 |
| DELETE /api/watch/:symbol | Gövde yok | 200 |
| POST /api/alerts | JSON: symbol, threshold | 201 |
| DELETE /api/alerts/:id | Gövde yok | 200 |

Uç nokta gövdelerinin somut örnekleri `tests/project.test.js` ve `scripts/seed.js` içinde bulunur. `:id` alanlarını önceki oluşturma yanıtından al. Hatalar JSON `{"error":"açıklama"}` biçimindedir; 401 giriş, 403 rol/origin, 404 kayıt/sahiplik, 409 çakışma, 422 doğrulama, 429 kota anlamına gelir. Listeler küçük yerel demo kapsamındadır; tümünde sayfalama yoktur.

```text
POST /api/alerts
{"symbol":"BTC-DEMO","threshold":61000}
201 {"id":"<alert-id>"}
```

## Kabul senaryoları

- [ ] Aynı favori iki PUT isteğinde tek satır olmalı.
- [ ] Üç sembolün fiyatı ve artan sıra numarası görünmeli.
- [ ] Geçersiz sembolle alarm oluşturma 422 dönmeli.
- [ ] İkinci kullanıcının favorileri ayrı kalmalı.

## İlk gün yapacağın çalışma

Fiyat tablosunu ve favori işlemini incele. İkinci tarayıcı oturumunda favorilerin ayrıldığını göster; snapshot isteğinin sonucunu kaydet.

## Sonraki geliştirmeler

- [ ] Bağlantı geri geldiğinde otomatik snapshot al
- [ ] Veri eskiliği rozeti ekle
- [ ] Sağlayıcı adaptörü ve kota yönetimi ekle
- [ ] Yatay ölçek için ortak yayın kanalı tasarla

## GitHub sunumu

Önce kurulumu çalıştır, testleri oku ve en az bir davranışı kendin geliştir. Her gün yaptığın gerçek değişikliği açıklayan commit at. `feat: ...`, `fix: ...`, `test: ...`, `docs: ...` örnek öneklerdir. `docs/screenshot.png` başlangıç sürümünün ekranıdır; değişikliklerinden sonra kendi ekranınla güncelle.

`.gitignore`, node_modules, dist, data ve .env dosyalarını dışarıda bırakır. Veritabanını, anahtarları veya gerçek müşteri/aday belgelerini GitHub'a koyma. GitHub repo oluşturma/yükleme bu paket tarafından otomatik yapılmaz.

## Ortam ayarları

`.env.example` dosyasını `.env` olarak kopyala; dosya varsayılan npm komutlarında otomatik okunmaz. Kullanmak için `node --env-file=.env server/index.js --dev`. PORT varsayılan 3000, HOST 127.0.0.1, DB_PATH data/app.sqlite. DEMO_PASSWORD yalnız yeni veritabanında hesap oluşturulurken kullanılır; var olan parolayı değiştirmez. COOKIE_SECURE yalnız HTTPS ortamında 1 olmalı. Farklı projeleri aynı anda çalıştırırken farklı PORT kullan.

## Dağıtım notu

Bu sürüm yerel portfolyo/öğrenme içindir. Genel internete açmadan önce demo hesaplarını kaldırıp kayıt/parola sıfırlama ve gerçek kullanıcı yaşam döngüsü ekle. Tek süreç/senkron SQLite yaklaşımı yoğun trafikli hizmet için hedef mimari değildir. PostgreSQL geçişinde SQL tipleri, transaction sınırları, indeksler, migration ve yedeklemeyi ayrıca tasarla. Dockerfile genel Node uygulaması içindir; Docker runner ve FFmpeg gibi özel bağımlılıklar otomatik kurulmaz.

## Mülakat provası

SSE neden burada yeterli? Kopuk bağlantı sırasında kaçan fiyat noktaları ve alarmlar nasıl tamamlanır?

## Lisans

MIT; bağımlılıkların kendi lisansları saklıdır.
