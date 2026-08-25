const fs = require('fs');
const path = require('path');

// Ключ берется из секретов GitHub
const API_KEY = process.env.GEMINI_API_KEY;

async function generateArticle() {
  if (!API_KEY) {
    console.error("Ошибка: API ключ не найден!");
    process.exit(1);
  }

  // 1. Формируем запрос к нейросети
  const prompt = `Напиши интересную и полезную статью на актуальную тему сео создания сайта. 
  Верни ТОЛЬКО чистый HTML-код (без тегов \`\`\`html или <html><head>, только теги <h1>, <p>, <h2>, <ul> и т.д.). 
  Первый тег должен быть <h1> с заголовком статьи.`;

  console.log("Запрашиваем статью у AI...");
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const articleBody = data.candidates[0].content.parts[0].text;

  // 2. Генерируем уникальное имя файла по дате и времени
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // ГГГГ-ММ-ДД
  const fileName = `article-${dateStr}-${Date.now()}.html`;
  const filePath = path.join(__dirname, 'articles', fileName);

  // 3. Собираем полный HTML-документ со стилями
  const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Статья от ${dateStr}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <p><a href="/articles/index.html">← Назад к списку статей</a></p>
    <hr>
    ${articleBody}
</body>
</html>`;

  // 4. Сохраняем файл в папку articles
  if (!fs.existsSync('./articles')) {
    fs.mkdirSync('./articles');
  }
  fs.writeFileSync(filePath, fullHtml);
  console.log(`Статья успешно создана: articles/${fileName}`);
}

generateArticle().catch(console.error);