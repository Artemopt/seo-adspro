const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;

async function generateArticle() {
  if (!API_KEY) {
    console.error("Ошибка: API ключ GEMINI_API_KEY не найден в переменных окружения!");
    process.exit(1);
  }

  // Темы для случайного выбора при генерации
  const topics = [
    "Как оптимизировать сайт для поисковых систем (SEO) в 2026 году",
    "Правильная настройка рекламы Google Ads: как не сливать бюджет",
    "Как веб-дизайн и UX влияют на конверсию интернет-магазина",
    "Что такое контент-маркетинг и как он помогает привлекать клиентов",
    "Скорость загрузки сайта (Core Web Vitals) и её влияние на SEO",
    "Зачем бизнесу нужен блог и как регулярно писать полезные статьи"
  ];
  
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Напиши интересную, структурированную и полезную статью на тему: "${selectedTopic}".
Требования:
1. Верни ТОЛЬКО чистый HTML-код без разметки markdown (без \`\`\`html или \`\`\`).
2. Не используй теги <html>, <head> или <body>.
3. Начни прямо с тега <h1>, в котором укажи заголовок статьи.
4. Разбей текст на логические блоки с помощью тегов <h2>, <p>, <ul>, <li>, <strong>.
5. Объем статьи: около 400-600 слов.
6. Язык статьи: русский.`;

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
    
    // Очистка от возможных разделителей markdown
    articleBody = articleBody.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    // Извлекаем заголовок из первого <h1>
    const titleMatch = articleBody.match(/<h1>(.*?)<\/h1>/i);
    const articleTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : selectedTopic;

    // Генерируем имя файла
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeHash = Date.now().toString().slice(-4);
    const fileName = `article-${dateStr}-${timeHash}.html`;
    const articlesDir = path.join(__dirname, 'articles');

    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    // Собираем полный HTML-документ статьи
    const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.7;
            color: #2c3e50;
            background-color: #fff;
        }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .back-link { margin-bottom: 20px; display: inline-block; font-weight: 500; }
        hr { border: 0; border-top: 1px solid #eee; margin: 20px 0 30px 0; }
        h1 { font-size: 2.2em; color: #1a252f; line-height: 1.3; }
        h2 { font-size: 1.5em; margin-top: 30px; color: #2c3e50; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
        p { margin: 16px 0; font-size: 1.05em; }
        ul, ol { padding-left: 24px; margin: 16px 0; }
        li { margin-bottom: 8px; font-size: 1.05em; }
    </style>
</head>
<body>
    <a href="/articles/index.html" class="back-link">← Все статьи</a>
    <hr>
    ${articleBody}
</body>
</html>`;

    const filePath = path.join(articlesDir, fileName);
    fs.writeFileSync(filePath, fullHtml, 'utf8');
    console.log(` Успешно создана новая статья: articles/${fileName}`);

    // Автоматически обновляем общий список в articles/index.html
    updateArticlesIndex(articlesDir);

  } catch (err) {
    console.error("Произошла ошибка во время выполнения скрипта:", err);
    process.exit(1);
  }
}

function updateArticlesIndex(articlesDir) {
  console.log(" Обновляем файл articles/index.html...");
  
  // Читаем ВСЕ .html файлы в папке, за исключением index.html
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.html') && file.toLowerCase() !== 'index.html');

  const items = files.map(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Поиск заголовка из <title> или <h1>
    const titleMatch = content.match(/<title>(.*?)<\/title>/i) || content.match(/<h1>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : file;
    const stat = fs.statSync(filePath);

    return { file, title, mtime: stat.mtimeMs };
  });

  // Сортировка: самые свежие статьи вверху
  items.sort((a, b) => b.mtime - a.mtime);

  // Формируем ссылки относительно папки articles/
  const linksList = items.map(item => {
    return `        <li><a href="${item.file}">${item.title}</a></li>`;
  }).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Блог — Все статьи</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8f9fa;
        }
        .header { margin-bottom: 30px; }
        .back-home { display: inline-block; margin-bottom: 15px; color: #0066cc; text-decoration: none; font-weight: 500; }
        .back-home:hover { text-decoration: underline; }
        h1 { font-size: 2em; color: #1a252f; margin: 0 0 10px 0; }
        p.subtitle { color: #6c757d; margin: 0; }
        ul.article-list { list-style: none; padding: 0; margin: 30px 0 0 0; }
        ul.article-list li { margin-bottom: 12px; }
        ul.article-list a {
            display: block;
            padding: 18px 22px;
            background: #ffffff;
            color: #1a252f;
            text-decoration: none;
            font-size: 1.1em;
            font-weight: 600;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
            transition: all 0.2s ease;
        }
        ul.article-list a:hover {
            border-color: #0066cc;
            color: #0066cc;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,102,204,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="/" class="back-home">← На главную</a>
        <h1>Список всех статей</h1>
        <p class="subtitle">Полезные материалы по SEO, контекстной рекламе и веб-разработке</p>
    </div>
    <ul class="article-list">
${linksList}
    </ul>
</body>
</html>`;

  fs.writeFileSync(path.join(articlesDir, 'index.html'), indexHtml, 'utf8');
  console.log(" Файл articles/index.html успешно обновлен!");
}

generateArticle();