# FailLens

**Playwright hataları için kanıta dayalı, isteğe bağlı yapay zekâ destekli inceleme.**

Playwright testin başarısız olduğunu söyler. FailLens, eldeki hata mesajlarını, adımları, ağ hatalarını ve tekrar denemeleri inceler; kanıt kimlikleriyle desteklenen bir hipotez sunar. Kesin kök neden bulduğunu iddia etmez.

## Hızlı başlangıç

Node.js 20.19 veya üzeri ile proje dizininde:

```sh
npm ci
npm run demo
npm run build
node dist/cli.js analyze fixtures/product-bug/backend-500/input.json --ai off
```

API anahtarı ve tarayıcı indirmesi gerekmez. Paket henüz yayımlanmadı; `faillens` adı öneridir ve kullanılabilirliği doğrulanmalıdır.

## Çıktılar

`product_bug`, `test_bug`, `environment`, `flaky_suspect` ve `unknown` kategorileri kullanılır. Kanıt yetersizse veya çelişiyorsa `unknown` döner. Güven değeri, kalibre edilmiş bir olasılık değildir.

```sh
node dist/cli.js analyze artifacts/results.json --format markdown --output artifacts/triage.md
node dist/cli.js analyze artifacts/results.json --format json
```

## Gerçek tarayıcı demosu

```sh
npm exec playwright install chromium
npm run demo:playwright
```

Beş senaryo kasıtlı olarak başarısız olur; tekrar deneme senaryosu ikinci denemede geçer. Demo aracı kategorileri doğrular. Normal CI entegrasyonunda Playwright'ın başarısızlık durumu korunmalıdır.

## Yapay zekâ ve gizlilik

Varsayılan kip tamamen yereldir. `OPENAI_API_KEY` ortam değişkenini güvenli biçimde ayarladıktan sonra `npm run demo:ai` komutuyla OpenAI kullanılabilir. `.env` dosyaları otomatik yüklenmez. Her hata için en fazla bir istek yapılır. Geçersiz yanıt veya servis hatasında deterministik sonuç ve uyarı sunulur.

Göndermeden önce yaygın anahtarlar, çerezler, parola alanları, JWT benzeri değerler, e-posta adresleri ve URL sorgu değerleri maskelenir. Bu işlem tüm gizli veri biçimlerini tanıyacağı garantisini vermez. Ekran görüntüleri ve ham iz dosyaları modele gönderilmez. Modelin kabuk, dosya, tarayıcı veya kod değiştirme yetkisi yoktur.

Playwright JSON tek başına ağ ve tarayıcı konsolunu kaydetmez. İsteğe bağlı `collectEvidence` kullanımı ve sınırları [İngilizce README](README.md#example-collect-richer-evidence) içinde açıklanmıştır. Eksik kayıt, hiç istek yapılmadığı anlamına gelmez.

## Doğrulama

```sh
npm run check
npm run test:coverage
npm run eval
npm run test:package
```

Varsayılan testler canlı model çağrısı yapmaz. 14 sentetik örnek bir regresyon kümesidir; gerçek dünya kök neden doğruluğunu ölçmez. [Mimari](docs/architecture.md), [güvenlik modeli](docs/security.md) ve [katkı kuralları](CONTRIBUTING.md) daha fazla ayrıntı içerir.

## Lisans

[MIT](LICENSE).
