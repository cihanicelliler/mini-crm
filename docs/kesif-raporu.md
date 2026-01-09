# Mini-CRM Keşif ve Gereksinim Analiz Raporu

**Tarih:** 08-01-2026  
**Hazırlayan:** Kıdemli Full-Stack Yazılım Mühendisi  
**Proje Durumu:** ~%40 tamamlanmış

---

## 1. Mevcut Yapı Özeti

### Teknik Stack
| Bileşen | Teknoloji | Versiyon |
|---------|-----------|----------|
| Runtime | Node.js | - |
| Framework | Express.js | ^4.19.0 |
| ORM | Sequelize | ^6.37.0 |
| Database | PostgreSQL | ^8.11.0 (pg) |
| Logging | Winston | ^3.11.0 |
| Test | Jest + Supertest | ^29.7.0, ^6.3.4 |

### Dizin Yapısı
```
mini-crm/
├── api/                    # API dökümantasyonu (sadece txt)
├── config/                 # BOŞ (kullanılmıyor)
├── docs/                   # BOŞ
├── migrations/             # 2 migration dosyası (eksik/tutarsız)
├── scripts/etl/            # BOŞ (ETL planlanmış ama yapılmamış)
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server başlatma
│   ├── config/index.js     # Konfigürasyon (eksik)
│   ├── lib/logger.js       # Winston logger (basit)
│   ├── middleware/         # BOŞ
│   ├── models/             # Customer, Order modelleri
│   ├── routes/             # customers.js, orders.js
│   └── services/           # customerService.js (eksik)
└── tests/                  # Tek test dosyası (hatalı)
```

---

## 2. Tespit Edilen Sorunlar

### 2.1 Veritabanı ve Migrationlar

> **UYARI:** Model-Migration Tutarsızlığı: Migration dosyaları ile Sequelize modelleri birebir uyuşmuyor.

| Sorun | Detay |
|-------|-------|
| `isActive` alanı | Customer modelinde var, migration'da **YOK** |
| Foreign Key | `orders.customer_id` için constraint **YOK** |
| Status alanı | Migration'da `allowNull: true`, modelde `allowNull: false` |
| Products tablosu | Planlanmış ama **hiç oluşturulmamış** |
| OrderItems tablosu | Planlanmış ama **hiç oluşturulmamış** |

### 2.2 API Uçları

**Mevcut (Çalışan):**
- `GET /api/customers` - Liste (limit: 50, pagination yok)
- `POST /api/customers` - Oluşturma (validation yok)
- `GET /api/orders` - Liste (limit: 20, filtreleme yok)

**Eksik:**
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id`
- `DELETE /api/orders/:id`
- Tüm `/api/products` uçları

### 2.3 Konfigürasyon ve Güvenlik

> **UYARI:** `.env` dosyası veya `.env.example` mevcut değil. Şifreler hardcoded olabilir.

| Sorun | Detay |
|-------|-------|
| `.env.example` | **YOK** |
| `.gitignore` | Sadece `node_modules` içeriyor, `.env` **eklenmemiş** |
| Ortam ayrımı | dev/test/prod ayrımı yapılmamış |
| Rate Limiting | **YOK** |
| CORS | **YOK** |

### 2.4 Logging

| Eksiklik | Açıklama |
|----------|----------|
| Trace ID | Request takibi için **yok** |
| File Transport | Sadece console, dosyaya yazmıyor |
| Prod Format | Üretim için JSON format **yok** |
| Hassas Veri | Payload'lar direkt loglanıyor (GDPR riski) |

### 2.5 Servis Katmanı

- `customerService.js`: Sadece `listCustomers` ve `createCustomer` var
- `orderService.js`: **HİÇ YOK** (route içinde direkt model kullanılıyor)
- Validation: **YOK**
- Normalizasyon: **YOK**

### 2.6 Testler

> **UYARI:** Mevcut test dosyası bozuk ve güvenilmez.

| Sorun | Detay |
|-------|-------|
| `sync({ force: true })` | Migration yerine sync kullanılıyor |
| Hatalı assertion | `expect(res.body.length).toBeGreaterThan(1)` ama 1 kayıt var |
| Coverage | Tahmin: %10-15 |
| teardown | Test sonrası temizlik **yok** |

### 2.7 ETL

- `scripts/etl/` dizini **boş**
- Örnek veri yükleme scripti **yok**
- Telefon normalizasyonu **planlanmamış**

---

## 3. Müşteri Netleştirme Soru Listesi

### 3.1 Müşteri (Customer) Yönetimi

1. **Telefon Numarası Zorunluluğu:** Müşteri kaydı oluştururken telefon numarası zorunlu mu olmalı?
2. **E-posta Zorunluluğu:** E-posta adresi zorunlu mu?
3. **Soyad Zorunluluğu:** Tek isimli müşteriler kabul edilecek mi?
4. **Müşteri Silme:** Siparişi olan müşteri silinebilir mi?

### 3.2 Sipariş (Order) Yönetimi

5. **Kayıtsız Müşteri ile Sipariş:** Sistemde kayıtlı olmayan müşteri için sipariş oluşturulabilir mi?
6. **Sipariş Durumları:** Hangi durumlar (status) kullanılacak?
7. **Sipariş Düzenleme:** Sipariş oluşturulduktan sonra düzenlenebilir mi?

### 3.3 Ürün (Product) ve Stok Yönetimi

8. **Ürün Modülü Kapsamı:** Ürün yönetimi sistemin bir parçası mı olacak?
9. **Stok Takibi:** Her ürün için stok takibi zorunlu mu?
10. **Stokta Yoksa:** Stokta olmayan ürün sipariş edilebilir mi?
11. **Negatif Stok:** Stok negatife düşebilir mi?

### 3.4 Adres Yönetimi

12. **Adres Zorunluluğu:** Kayıt sırasında opsiyonel, sipariş sırasında zorunlu mu?
13. **Çoklu Adres:** Bir müşterinin birden fazla adresi olabilir mi?

### 3.5 ETL ve Veri Aktarımı

14. **Çift Kayıtlar:** Aynı isim-soyad veya telefon numarasına sahip kayıtlar ne yapılmalı?
15. **Hatalı E-posta:** Geçersiz formatta e-postalar nasıl işlenmeli?
16. **Mevcut Veri:** PDF'deki örnek veriler gerçek mi test verisi mi?

### 3.6 API ve Entegrasyon

17. **Kimlik Doğrulama:** API uçları için authentication gerekli mi?
18. **Dış Sistem Entegrasyonu:** Kargo, ödeme entegrasyonu var mı/olacak mı?

### 3.7 Genel

19. **Dil Tercihi:** Durum ve hata mesajları Türkçe mi İngilizce mi olmalı?
20. **Öncelik Sıralaması:** Hangi özellikler MVP için kritik?

---

## 4. Sonraki Adımlar

1. Müşteri cevapları alınacak
2. Gereksinim Analiz Dokümanı güncellenecek
3. Adım 2: Altyapı Düzeltme fazına geçilecek
