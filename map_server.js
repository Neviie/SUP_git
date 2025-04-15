const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // Можешь поставить 80, если нет nginx

const mapDir = path.join(__dirname, 'map');
const markersFile = path.join(mapDir, 'markers.json');

// Чтобы парсить JSON в теле запроса
app.use(express.json());

// Раздаём статику из папки map (HTML, CSS, JS и markers.json)
app.use('/map', express.static(mapDir));

// Получаем сохранённые метки
app.get('/map/markers.json', (req, res) => {
  fs.readFile(markersFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка чтения markers.json:', err);
      return res.json([]);
    }
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      res.json([]);
    }
  });
});

// Сохраняем новую метку
app.post('/map/save-marker', (req, res) => {
  const marker = req.body;

  fs.readFile(markersFile, 'utf8', (err, data) => {
    let markers = [];
    if (!err && data) {
      try {
        markers = JSON.parse(data);
      } catch (e) {
        console.error('Ошибка парсинга старых меток:', e);
      }
    }

    markers.push(marker);

    fs.writeFile(markersFile, JSON.stringify(markers, null, 2), (err) => {
      if (err) {
        console.error('Ошибка записи markers.json:', err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    });
  });
});

// Сброс меток в полночь
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;

  setTimeout(() => {
    fs.writeFile(markersFile, '[]', err => {
      if (err) console.error('Ошибка сброса меток:', err);
      else console.log('Метки сброшены.');
    });
    scheduleMidnightReset(); // Повторяем
  }, msUntilMidnight);
}

scheduleMidnightReset();

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}/map`);
});
