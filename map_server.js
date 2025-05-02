const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const mapDir = path.join(__dirname, 'map');
const markersFile = path.join(mapDir, 'markers.json');

// Логируем путь к файлу меток
console.log('📁 Путь к markers.json:', markersFile);

// Проверка: существует ли файл markers.json, если нет — создаём
if (!fs.existsSync(markersFile)) {
  fs.writeFileSync(markersFile, '[]', 'utf8');
  console.log('✅ markers.json создан');
}

app.use(express.json());

// Раздаём статику
app.use('/map', express.static(mapDir));

// Получить метки
app.get('/map/markers.json', (req, res) => {
  fs.readFile(markersFile, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Ошибка чтения markers.json:', err.message);
      return res.json([]);
    }
    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (e) {
      console.error('❌ Ошибка парсинга JSON:', e.message);
      res.json([]);
    }
  });
});

// Сохранить метку
app.post('/map/save-marker', (req, res) => {
  const marker = req.body;

  if (!marker || !marker.coords || !marker.comment || !marker.timestamp) {
    console.warn('⚠️ Неверные данные метки:', marker);
    return res.status(400).send('Неверные данные метки');
  }

  fs.readFile(markersFile, 'utf8', (err, data) => {
    let markers = [];
    if (!err && data) {
      try {
        markers = JSON.parse(data);
      } catch (e) {
        console.error('❌ Ошибка парсинга старых меток:', e.message);
      }
    }

    markers.push(marker);

    fs.writeFile(markersFile, JSON.stringify(markers, null, 2), (err) => {
      if (err) {
        console.error('❌ Ошибка записи markers.json:', err.message);
        return res.status(500).send('Ошибка сервера: ' + err.message);
      }
      console.log('✅ Метка добавлена:', marker);
      res.sendStatus(200);
    });
  });
});

// Автоматический сброс меток в полночь
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;

  setTimeout(() => {
    fs.writeFile(markersFile, '[]', (err) => {
      if (err) {
        console.error('❌ Ошибка сброса меток:', err.message);
      } else {
        console.log('🕛 Метки сброшены в полночь.');
      }
    });
    scheduleMidnightReset(); // Запускаем заново
  }, msUntilMidnight);
}

scheduleMidnightReset();

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}/map`);
});

