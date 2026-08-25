const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;

async function generateArticle() {
  const articlesDir = path.join(__dirname, 'articles');

  if (!API_KEY) {
    console.warn("Предупреждение: GEMINI_API_KEY не найден. Генерация статьи пропущена, пересобираем articles/index.html...");
    updateArticlesIndex(articlesDir);
    return;
  }

  const topics = [
    "Як оптимізувати сайт для пошукових систем (SEO) у 2026 році",
    "Правильне налаштування реклами Google Ads: як не злити бюджет",
    "Як веб-дизайн та UX впливають на конверсію інтернет-магазину",
    "Що таке контент-маркетинг і як він допомагає залучати клієнтів",
    "Швидкість завантаження сайту (Core Web Vitals) та її вплив на SEO",
    "Навіщо бізнесу потрібен блог і як регулярно писати корисні статті"
  ];
  
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Напиши цікаву, структуровану та корисну статтю українською мовою на тему: "${selectedTopic}".
Вимоги:
1. Поверни ТІЛЬКИ чистий HTML-код без розмітки markdown (без \`\`\`html або \`\`\`).
2. Не використовуй теги <html>, <head> або <body>.
3. Почни прямо з тегу <h1>, у якому вкажи заголовок статті.
4. Розбий текст на логічні блоки за допомогою тегів <h2>, <p>, <ul>, <li>, <strong>.
5. Обсяг статті: близько 400-600 слів.
6. Мова статті: українська.`;

  console.log(`Запрашиваем статью у Gemini API на тему: "${selectedTopic}"...`);
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(API_KEY)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.candidates || !data.candidates[0]) {
      console.error("Ошибка от Gemini API:", JSON.stringify(data, null, 2));
      process.exit(1);
    }

    let articleBody = data.candidates[0].content.parts[0].text.trim();
    articleBody = articleBody.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    const titleMatch = articleBody.match(/<h1>(.*?)<\/h1>/i);
    const articleTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : selectedTopic;
    articleBody = articleBody.replace(/<h1>.*?<\/h1>/i, '').trim();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeHash = Date.now().toString().slice(-4);
    const fileName = `article-${dateStr}-${timeHash}.html`;

    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleTitle} — SEO AdsPro</title>
    <meta name="description" content="${articleTitle}">
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314161a'/%3E%3Ctext x='16' y='22' font-size='17' font-family='Georgia,serif' fill='%23C9A227' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
</head>
<body>

<header>
  <nav>
    <a href="../index.html" class="logo"><span class="mark">S</span>SEO&nbsp;AdsPro</a>
    <div class="links">
      <a href="../index.html#site-creation">Створення сайту</a>
      <a href="../index.html#site-promotion">Просування сайту</a>
      <a href="../index.html#site-ads">Реклама на сайт</a>
      <span class="nav-sep" aria-hidden="true"></span>
      <a href="../index.html#process">Процес</a>
      <a href="../index.html#pricing">Тарифи</a>
      <a href="../index.html#faq">Питання</a>
      <a class="is-service" href="index.html">Статті</a>
    </div>
    <a class="nav-cta" href="../index.html#cta">Обговорити проєкт</a>
  </nav>
</header>

<main>
  <article style="padding: 60px 0 100px;">
    <div class="container" style="max-width: 800px;">
      <a href="index.html" style="color: var(--gold); text-decoration: none; font-size: 14px; font-weight: 600;">← Назад до усіх статей</a>
      
      <h1 style="margin-top: 24px; font-family: Georgia, serif; font-size: clamp(28px, 4vw, 42px); line-height: 1.2;">${articleTitle}</h1>
      <div style="color: var(--muted); font-size: 14px; margin: 16px 0 40px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        SEO та реклама · 5 хв читання
      </div>

      <div class="article-content" style="color: var(--ink); line-height: 1.75; font-size: 16.5px;">
        ${articleBody}
      </div>
    </div>
  </article>
</main>

<footer>
  <div class="container">
    <div class="foot-grid">
      <div>
        <div class="logo" style="margin-bottom:14px;"><span class="mark">S</span>SEO&nbsp;AdsPro</div>
        <p style="max-width:280px;">Створення сайтів, SEO-просування та налаштування реклами під одним кошторисом і одним підрядником.</p>
      </div>
      <div>
        <h3>Послуги</h3>
        <a href="../index.html#site-creation">Створення сайту</a>
        <a href="../index.html#site-promotion">Просування сайту</a>
        <a href="../index.html#site-ads">Реклама на сайт</a>
        <a href="index.html">Статті</a>
      </div>
      <div>
        <h3>Контакти</h3>
        <a href="mailto:hello@seo-adspro.web.app">hello@seo-adspro.web.app</a>
        <a href="tel:+380680000000">+38 (068) 000-00-00</a>
        <a href="[https://seo-adspro.web.app/](https://seo-adspro.web.app/)">seo-adspro.web.app</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 SEO AdsPro. Усі права захищені.</span>
      <span>Створення сайтів · Просування · Реклама</span>
    </div>
  </div>
</footer>

</body>
</html>`;

    const filePath = path.join(articlesDir, fileName);
    fs.writeFileSync(filePath, fullHtml, 'utf8');
    console.log(` Успешно создана новая статья: articles/${fileName}`);

    updateArticlesIndex(articlesDir);

  } catch (err) {
    console.error("Произошла ошибка во время выполнения скрипта:", err);
    process.exit(1);
  }
}

function updateArticlesIndex(articlesDir) {
  console.log(" Обновляем файл articles/index.html...");

  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }

  // Сканируем все HTML файлы кроме самого index.html
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.toLowerCase().endsWith('.html') && file.toLowerCase() !== 'index.html');

  const items = files.map(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/<title>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(' — SEO AdsPro', '').trim() : file;
    
    if (!title || title === '') {
      title = file.replace(/\.html$/i, '');
    }

    const stat = fs.statSync(filePath);
    return { file, title, mtime: stat.mtimeMs };
  });

  items.sort((a, b) => b.mtime - a.mtime);

  const cardsList = items.length > 0 ? items.map((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return `        <a class="article-card" href="${item.file}">
          <div class="article-cover"><span class="kicker">${num} · Стаття</span></div>
          <div class="article-card-body">
            <div class="article-meta">Блог SEO AdsPro · 5 хв читання</div>
            <h3>${item.title}</h3>
            <span class="article-read">Читати статтю →</span>
          </div>
        </a>`;
  }).join('\n') : '<p style="color:var(--muted); text-align:center; width:100%;">Поки що немає опублікованих статей.</p>';

  const indexHtml = `<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Статті та Блог — SEO AdsPro</title>
    <meta name="description" content="Корисні статті про створення сайтів, SEO-просування та налаштування Google Ads от SEO AdsPro.">
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314161a'/%3E%3Ctext x='16' y='22' font-size='17' font-family='Georgia,serif' fill='%23C9A227' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
</head>
<body>

<header>
  <nav>
    <a href="../index.html" class="logo"><span class="mark">S</span>SEO&nbsp;AdsPro</a>
    <div class="links">
      <a href="../index.html#site-creation">Створення сайту</a>
      <a href="../index.html#site-promotion">Просування сайту</a>
      <a href="../index.html#site-ads">Реклама на сайт</a>
      <span class="nav-sep" aria-hidden="true"></span>
      <a href="../index.html#process">Процес</a>
      <a href="../index.html#pricing">Тарифи</a>
      <a href="../index.html#faq">Питання</a>
      <a class="is-service" href="index.html">Статті</a>
    </div>
    <a class="nav-cta" href="../index.html#cta">Обговорити проєкт</a>
  </nav>
</header>

<main>
  <section id="articles" style="padding: 60px 0 100px;">
    <div class="container">
      <div class="sec-head reveal">
        <div class="sec-tag">Блог</div>
        <h2>Статті про сайти, SEO та рекламу</h2>
        <p>Коротко й по суті — те, що ми самі розповідаємо клієнтам перед стартом проєкту.</p>
      </div>

      <div class="articles-grid reveal">
${cardsList}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="container">
    <div class="foot-grid">
      <div>
        <div class="logo" style="margin-bottom:14px;"><span class="mark">S</span>SEO&nbsp;AdsPro</div>
        <p style="max-width:280px;">Створення сайтів, SEO-просування та налаштування реклами під одним кошторисом і одним підрядником.</p>
      </div>
      <div>
        <h3>Послуги</h3>
        <a href="../index.html#site-creation">Створення сайту</a>
        <a href="../index.html#site-promotion">Просування сайту</a>
        <a href="../index.html#site-ads">Реклама на сайт</a>
        <a href="index.html">Статті</a>
      </div>
      <div>
        <h3>Контакти</h3>
        <a href="mailto:hello@seo-adspro.web.app">hello@seo-adspro.web.app</a>
        <a href="tel:+380680000000">+38 (068) 000-00-00</a>
        <a href="[https://seo-adspro.web.app/](https://seo-adspro.web.app/)">seo-adspro.web.app</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 SEO AdsPro. Усі права захищені.</span>
      <span>Створення сайтів · Просування · Реклама</span>
    </div>
  </div>
</footer>

<script>
  var els = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:.12});
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(articlesDir, 'index.html'), indexHtml, 'utf8');
  console.log(" Файл articles/index.html успешно обновлен!");
}

generateArticle();