let map, userMarker;
const controlMarkers = [];
let currentCoords = null;

ymaps.ready(init);

function init() {
  map = new ymaps.Map("map", {
    center: [55.751244, 37.618423],
    zoom: 12
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
      const coords = [position.coords.latitude, position.coords.longitude];

      if (!userMarker) {
        userMarker = new ymaps.Placemark(coords, {
          hintContent: "Вы здесь",
          balloonContent: "Ваше текущее местоположение"
        }, {
          preset: 'islands#blueCircleDotIcon',
          iconColor: '#1E90FF'
        });
        map.geoObjects.add(userMarker);
        map.setCenter(coords);
      } else {
        userMarker.geometry.setCoordinates(coords);
      }
    }, (err) => {
      console.error("Ошибка определения местоположения", err);
    });
  }

  document.getElementById("controlBtn").addEventListener("click", () => {
    if (!userMarker) return alert("Местоположение ещё не определено.");
    currentCoords = userMarker.geometry.getCoordinates();
    showCommentModal();
  });

  map.events.add('click', function (e) {
    currentCoords = e.get('coords');
    showCommentModal();
  });

  document.getElementById("submitComment").addEventListener("click", () => {
    const comment = document.getElementById("commentInput").value.trim();
    if (!comment || !currentCoords) return;

    const timestamp = new Date().toLocaleString();

    const marker = new ymaps.Placemark(currentCoords, {
      balloonContentHeader: "Контроль",
      balloonContentBody: comment,
      balloonContentFooter: `Время: ${timestamp}`
    }, {
      preset: 'islands#redIcon',
      iconColor: '#FF6347'
    });

    map.geoObjects.add(marker);
    controlMarkers.push(marker);

    fetch("/map/save-marker", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coords: currentCoords, comment, timestamp })
    });

    hideCommentModal();
  });

  document.getElementById("cancelComment").addEventListener("click", () => {
    hideCommentModal();
  });

  function showCommentModal() {
    document.getElementById("commentModal").style.display = 'flex';
    document.getElementById("commentInput").value = '';
    document.getElementById("overlay").style.display = 'block';
    setTimeout(() => {
        const input = document.getElementById("commentInput");
        input.focus();
        input.scrollIntoView({ block: "center" });
      }, 300);
    map.behaviors.disable(['drag', 'scrollZoom', 'multiTouch', 'dblClickZoom']);
    document.body.classList.add("locked");
  }

  function hideCommentModal() {
    document.getElementById("commentModal").style.display = 'none';
    currentCoords = null;
    document.getElementById("overlay").style.display = 'none';
    map.behaviors.enable(['drag', 'scrollZoom', 'multiTouch', 'dblClickZoom']);
    document.body.classList.remove("locked");
  }

  document.addEventListener('touchstart', function (e) {
    const input = document.getElementById("commentInput");
    const modal = document.getElementById("commentModal");
  
    // Проверяем, что модал открыт и поле ввода в фокусе
    if (
      modal.style.display === 'flex' &&
      document.activeElement === input
    ) {
      // Если клик был по полю ввода, снимаем фокус
      if (e.target === input) {
        input.blur(); // Снимаем фокус с поля ввода
      } 
      // Если клик был вне модала или на самом модале, тоже снимаем фокус
      else if (!modal.contains(e.target) || e.target === modal) {
        input.blur(); // Снимаем фокус с поля ввода, клавиатура закроется
      }
    }
  
    // Дополнительная проверка на клик по кнопкам внутри модала
    if (modal.style.display === 'flex' && e.target.closest('.modal-button')) {
      input.blur(); // Снимаем фокус с поля ввода, если клик по кнопке в модале
    }
  }, { passive: true });
  
  

  fetch("/map/markers.json", { cache: "no-store" })
    .then(response => response.json())
    .then(data => {
      data.forEach(entry => {
        const marker = new ymaps.Placemark(entry.coords, {
          balloonContentHeader: "Контроль",
          balloonContentBody: entry.comment,
          balloonContentFooter: `Время: ${entry.timestamp}`
        }, {
          preset: 'islands#redIcon',
          iconColor: '#FF6347'
        });
        map.geoObjects.add(marker);
        controlMarkers.push(marker);
      });
    })
    .catch(err => console.error("Ошибка загрузки меток:", err));

  const now = new Date();
  const millisTillMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    controlMarkers.forEach(marker => map.geoObjects.remove(marker));
    controlMarkers.length = 0;
  }, millisTillMidnight);
}

if (Telegram.WebApp.setResizeMode) {
  Telegram.WebApp.setResizeMode('stable');
}
