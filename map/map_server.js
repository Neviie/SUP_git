const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // или 80 если без nginx

const MARKERS_FILE = path.join(__dirname, 'public/map/markers.json');

app.use(express.json());
app.use('/map', express.static(path.join(__dirname, 'public/map')));

// Получить метки
app.get('/map/markers.json', (req, res) => {
  fs.readFile(MARKERS_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  });
});

// Сохранить метку
app.post('/map/save-marker', (req, res) => {
  const marker = req.body;
  fs.readFile(MARKERS_FILE, 'utf8', (err, data) => {
    const markers = !err ? JSON.parse(data || '[]') : [];
    markers.push(marker);
    fs.writeFile(MARKERS_FILE, JSON.stringify(markers, null, 2), () => {
      res.sendStatus(200);
    });
  });
});

// Очистка меток в полночь
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    fs.writeFile(MARKERS_FILE, '[]', () => {
      console.log('Метки сброшены в полночь');
    });
    scheduleMidnightReset();
  }, msUntilMidnight);
}
scheduleMidnightReset();

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
