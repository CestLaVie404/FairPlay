const uploadInput = document.getElementById('uploadImage');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

const imageListDiv = document.getElementById('imageList');
const tileForm = document.getElementById('tileForm');
const tilesContainer = document.getElementById('tilesContainer');

const tileImageInput = document.getElementById('tileImage');
const tileTitleInput = document.getElementById('tileTitle');
const tileTextInput = document.getElementById('tileText');
const tileColorInput = document.getElementById('tileColor');
const tileLinkInput = document.getElementById('tileLink');
const tileCategoryInput = document.getElementById('tileCategory');

let images = [];
let tiles = [];
let selectedTileIndex = null; // Wenn eine Kachel zum Bearbeiten gewählt wird

// Bilder laden
async function loadImages() {
  try {
    const res = await fetch('/uploads/list');
    images = await res.json();

    imageListDiv.innerHTML = '';
    images.forEach(imgUrl => {
      const div = document.createElement('div');
      div.className = 'image-thumb';
      const img = document.createElement('img');
      img.src = imgUrl;
      div.appendChild(img);
      div.addEventListener('click', () => {
        selectImage(imgUrl, div);
      });
      imageListDiv.appendChild(div);
    });
  } catch (e) {
    console.error('Fehler beim Laden der Bilder:', e);
  }
}

function selectImage(url, div) {
  // Entferne Auswahl bei allen Bildern
  document.querySelectorAll('.image-thumb.selected').forEach(el => el.classList.remove('selected'));
  // Markiere das gewählte Bild
  div.classList.add('selected');
  tileImageInput.value = url;
}

// Kacheln laden
async function loadTiles() {
  try {
    const res = await fetch('/tiles');
    tiles = await res.json();
    renderTiles();
  } catch (e) {
    console.error('Fehler beim Laden der Kacheln:', e);
  }
}

// Kacheln anzeigen
function renderTiles() {
  tilesContainer.innerHTML = '';
  tiles.forEach((tile, idx) => {
    const div = document.createElement('div');
    div.className = 'tile';
    div.style.borderColor = tile.color || '#ccc';
    div.innerHTML = `
      <img src="${tile.image}" alt="${tile.title}" style="max-width:100px; max-height:80px; display:block;"/>
      <strong>${tile.title}</strong><br/>
      <small>${tile.text}</small><br/>
      <button data-idx="${idx}" class="editBtn">Bearbeiten</button>
      <button data-idx="${idx}" class="delBtn">Löschen</button>
    `;
    tilesContainer.appendChild(div);
  });

  // Edit-Buttons
  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.idx;
      editTile(idx);
    });
  });
  // Delete-Buttons
  document.querySelectorAll('.delBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.idx;
      deleteTile(idx);
    });
  });
}

// Kachel bearbeiten
function editTile(idx) {
  selectedTileIndex = idx;
  const tile = tiles[idx];
  tileImageInput.value = tile.image;
  tileTitleInput.value = tile.title;
  tileTextInput.value = tile.text;
  tileColorInput.value = tile.color || '#ffffff';
  tileLinkInput.value = tile.link || '';
  tileCategoryInput.value = tile.category || '';
  // Markiere das Bild in der Liste, falls vorhanden
  document.querySelectorAll('.image-thumb.selected').forEach(el => el.classList.remove('selected'));
  const matchingDiv = [...imageListDiv.children].find(div => div.querySelector('img').src.endsWith(tile.image));
  if (matchingDiv) matchingDiv.classList.add('selected');
}

// Kachel löschen
function deleteTile(idx) {
  tiles.splice(idx, 1);
  saveTiles();
}

// Kachel speichern (neu oder bearbeitet)
tileForm.addEventListener('submit', e => {
  e.preventDefault();

  const newTile = {
    image: tileImageInput.value,
    title: tileTitleInput.value.trim(),
    text: tileTextInput.value.trim(),
    color: tileColorInput.value,
    link: tileLinkInput.value.trim(),
    category: tileCategoryInput.value.trim()
  };

  if (!newTile.image) {
    alert('Bitte ein Bild auswählen!');
    return;
  }
  if (selectedTileIndex !== null) {
    // Update bestehende Kachel
    tiles[selectedTileIndex] = newTile;
  } else {
    // Neue Kachel hinzufügen
    tiles.push(newTile);
  }
  selectedTileIndex = null;
  clearForm();
  renderTiles();
  saveTiles();
});

// Form zurücksetzen
function clearForm() {
  tileImageInput.value = '';
  tileTitleInput.value = '';
  tileTextInput.value = '';
  tileColorInput.value = '#ffffff';
  tileLinkInput.value = '';
  tileCategoryInput.value = '';
  document.querySelectorAll('.image-thumb.selected').forEach(el => el.classList.remove('selected'));
}

// Tiles speichern auf Server
async function saveTiles() {
  try {
    const res = await fetch('/save-tiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tiles)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Fehler beim Speichern');
  } catch (e) {
    alert('Fehler beim Speichern der Kacheln: ' + e.message);
  }
}

// Bild hochladen
uploadBtn.addEventListener('click', async () => {
  if (!uploadInput.files.length) {
    alert('Bitte eine Bilddatei auswählen');
    return;
  }
  const file = uploadInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  uploadStatus.textContent = 'Hochladen...';

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    uploadStatus.textContent = 'Hochgeladen: ' + data.imageUrl;
    // Bildliste aktualisieren und direkt auswählen
    await loadImages();
    // Bild im Formular auswählen
    tileImageInput.value = data.imageUrl;
    // Markiere Bild als ausgewählt in Liste
    document.querySelectorAll('.image-thumb.selected').forEach(el => el.classList.remove('selected'));
    const matchingDiv = [...imageListDiv.children].find(div => div.querySelector('img').src.endsWith(data.imageUrl));
    if (matchingDiv) matchingDiv.classList.add('selected');
  } catch (e) {
    uploadStatus.textContent = 'Fehler: ' + e.message;
  }
});

// Initiales Laden
loadImages();
loadTiles();
