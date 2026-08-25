generate_js_content = """const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;

async function generateArticle() {
  if (!API_KEY) {
    console.error("Ошибка: API ключ GEMINI_API_KEY не найден в переменном окружении!");
    process.exit(1);
  }

  // Темы для генерации (выбираются случайно для разнообразия)
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
3. Начни прямо с тега <h1>, в котором укажи заголовк статьи.
4. Разбей текст на логические блоки с помощью тегов <h2>, <p>, <ul>, <li>, <strong>.
5. Объем статьи: около 400-600 слов.
6. Язык статьи: русский.`;

  console.log(`Запрашиваем статью у Gemini API на тему: "${selectedTopic}"...`);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
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

    // Извлекаем заголовок из первого H1
    const titleMatch = articleBody.match(/<h1>(.*?)<\/h1>/i);
    const articleTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : selectedTopic;

    // Генерируем уникальное имя файла и путь
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
  
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

  // Формируем элементы списка
  const items = files.map(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Достаем заголовок из <title>
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : file;

    return {
      file: file,
      title: title
    };
  });

  // Новые статьи первыми (по имени файла или порядку)
  items.reverse();

  const linksList = items.map(item => {
    return `        <li><a href="/articles/${item.file}">${item.title}</a></li>`;
  }).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Все статьи</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #1a252f; border-bottom: 2px solid #eee; padding-bottom: 12px; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 14px; padding: 12px 16px; background: #f8f9fa; border-radius: 6px; transition: background 0.2s; }
        li:hover { background: #e9ecef; }
        a { color: #0066cc; text-decoration: none; font-size: 1.1em; font-weight: 500; display: block; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Список всех статей</h1>
    <ul>
${linksList}
    </ul>
</body>
</html>`;

  fs.writeFileSync(path.join(articlesDir, 'index.html'), indexHtml, 'utf8');
  console.log(" Файл articles/index.html успешно обновлен!");
}

generateArticle();
"""

with open("generate.js", "w", encoding="utf-8") as f:
    f.write(generate_js_content)