# 🏢 Mini-CRM

Müşteri ve sipariş yönetimi için Node.js tabanlı hafif CRM uygulaması.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-4.19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Kurulum](#-kurulum)
- [Proje Yapısı](#-proje-yapısı)
- [API Endpoints](#-api-endpoints)
- [ETL Script](#-etl-script)
- [Test](#-test)
- [Geliştirme](#-geliştirme)
- [Katkıda Bulunma](#-katkıda-bulunma)

---

## ✨ Özellikler

- 👥 **Müşteri Yönetimi** - Tam CRUD operasyonları
- 📦 **Sipariş Yönetimi** - Müşteri siparişleri ve durum takibi
- 🛒 **Ürün Yönetimi** - Stok takibi ile ürün kataloğu
- 🔄 **ETL Script** - Veri normalizasyonu ve tekilleştirme
- 📊 **Sayfalama** - Tüm listeleme endpointlerinde
- 🔍 **Trace ID** - Her istekte benzersiz takip kimliği
- 📝 **Logging** - Winston ile yapılandırılmış loglama
- ✅ **Validation** - Request body ve parametre doğrulama

---

## 🛠 Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| **Runtime** | Node.js 20.x |
| **Framework** | Express.js 4.19 |
| **Veritabanı** | PostgreSQL 15 |
| **ORM** | Sequelize 6.37 |
| **Logging** | Winston 3.11 |
| **Test** | Jest 29.7 + Supertest |
| **CI/CD** | GitHub Actions |

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 20.x veya üzeri
- PostgreSQL 15 veya üzeri
- npm veya yarn

### Adımlar

```bash
# 1. Repo'yu klonlayın
git clone https://github.com/your-username/mini-crm.git
cd mini-crm

# 2. Bağımlılıkları kurun
npm install

# 3. Ortam değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# 4. Veritabanını oluşturun
createdb mini_crm

# 5. Migration'ları çalıştırın
npm run migrate

# 6. Uygulamayı başlatın
npm run dev
```

### Ortam Değişkenleri

```env
NODE_ENV=development
APP_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mini_crm
DB_USER=postgres
DB_PASS=your_password

LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

---

## 📁 Proje Yapısı

```
mini-crm/
├── src/
│   ├── app.js              # Express uygulaması
│   ├── server.js           # Sunucu başlatma
│   ├── config/             # Ortam konfigürasyonu
│   ├── lib/
│   │   └── logger.js       # Winston logger
│   ├── middleware/
│   │   ├── traceId.js      # Trace ID middleware
│   │   ├── requestLogger.js # Request/Response logging
│   │   └── validate.js     # Validation middleware
│   ├── models/             # Sequelize modelleri
│   │   ├── customer.js
│   │   ├── order.js
│   │   ├── product.js
│   │   └── orderItem.js
│   ├── routes/             # API rotaları
│   │   ├── customers.js
│   │   ├── orders.js
│   │   └── products.js
│   ├── services/           # İş mantığı katmanı
│   │   ├── customerService.js
│   │   ├── orderService.js
│   │   └── productService.js
│   └── utils/
│       └── pagination.js   # Sayfalama yardımcısı
├── migrations/             # Veritabanı migration'ları
├── scripts/
│   └── etl/                # ETL scripti
│       ├── index.js
│       ├── transformers.js
│       └── deduplicator.js
├── tests/
│   ├── customers.test.js   # Integration testleri
│   ├── unit/               # Unit testler
│   └── integration/        # Integration testler
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions
└── docs/                   # Dokümantasyon
```

---

## 🔌 API Endpoints

### Müşteriler (`/api/customers`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/customers` | Tüm müşterileri listele (sayfalı) |
| GET | `/api/customers/:id` | Müşteri detayı |
| POST | `/api/customers` | Yeni müşteri oluştur |
| PUT | `/api/customers/:id` | Müşteri güncelle |
| DELETE | `/api/customers/:id` | Müşteri sil (soft delete) |

### Siparişler (`/api/orders`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/orders` | Siparişleri listele |
| GET | `/api/orders/:id` | Sipariş detayı (kalemlerle) |
| POST | `/api/orders` | Yeni sipariş (guest müşteri destekli) |
| PUT | `/api/orders/:id` | Sipariş durumu güncelle |
| DELETE | `/api/orders/:id` | Sipariş iptal et |

### Ürünler (`/api/products`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/products` | Ürünleri listele |
| GET | `/api/products/:id` | Ürün detayı |
| POST | `/api/products` | Yeni ürün oluştur |
| PUT | `/api/products/:id` | Ürün güncelle |
| PATCH | `/api/products/:id/stock` | Stok ayarla |
| DELETE | `/api/products/:id` | Ürün sil (soft delete) |

### Örnek İstekler

```bash
# Müşteri oluştur
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Ahmet", "lastName": "Yılmaz", "email": "ahmet@test.com"}'

# Guest müşteri ile sipariş oluştur
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerData": {"firstName": "Ali", "phone": "+905321234567"},
    "items": [{"productId": 1, "quantity": 2}]
  }'

# Stok ayarla
curl -X PATCH http://localhost:3000/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{"adjustment": -5}'
```

---

## 🔄 ETL Script

Müşteri verilerini normalize etmek ve temizlemek için ETL scripti:

```bash
# Örnek veri ile çalıştır
npm run etl:sample

# Özel dosya ile çalıştır
npm run etl -- --input=customers.json --output=./output

# Dry-run (dosya kaydetmeden)
npm run etl -- --input=data.json --dry-run

# Duplicates'i birleştir
npm run etl -- --input=data.json --merge
```

### Dönüşüm Kuralları

| Dönüşüm | Örnek |
|---------|-------|
| Telefon | `0532 123 45 67` → `+905321234567` |
| İsim | `"Mehmet"` → `Mehmet` |
| E-posta | Çift `@` → Hata |

### Çıktı Dosyaları

- `valid-customers.json` - Geçerli müşteriler
- `error-report.json` - Hatalı kayıtlar
- `duplicate-report.json` - Tekrarlanan kayıtlar
- `etl-summary.json` - İşlem özeti

---

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Coverage ile
npm test -- --coverage

# Sadece unit testler
npm test -- --testPathPattern=unit

# Sadece integration testler
npm test -- --testPathPattern=integration

# Watch mode
npm test -- --watch
```

### Test Yapısı

```
tests/
├── setup.js                    # Test utilities
├── customers.test.js           # Customer API testleri
├── unit/
│   ├── transformers.test.js    # ETL transformer testleri
│   └── pagination.test.js      # Pagination utility testleri
└── integration/
    └── products.test.js        # Products API testleri
```

---

## 💻 Geliştirme

### Komutlar

```bash
npm run dev      # Development mode (nodemon)
npm run start    # Production mode
npm run migrate  # DB migration
npm test         # Testleri çalıştır
npm run etl      # ETL script
```

### Logging

Uygulama Winston kullanarak log tutar:

- **Development**: Console (renkli, okunabilir)
- **Production**: JSON formatında dosyaya

```bash
# Log dosyaları
logs/app.log        # Tüm loglar
logs/app.error.log  # Sadece hatalar
```

### Trace ID

Her HTTP isteği benzersiz bir `X-Trace-Id` header'ı alır:

```bash
curl -v http://localhost:3000/api/customers
# < X-Trace-Id: 550e8400-e29b-41d4-a716-446655440000
```

---

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Mesaj Formatı

```
<type>(<scope>): <description>

feat:     Yeni özellik
fix:      Bug düzeltme
docs:     Dokümantasyon
refactor: Kod yeniden yapılandırma
test:     Test ekleme/düzeltme
chore:    Bakım işleri
```

---

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

Sorularınız için issue açabilirsiniz.
