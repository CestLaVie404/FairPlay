async function loadTiles() {
  try {
    const res = await fetch('/tiles');
    if (!res.ok) throw new Error('Kacheln konnten nicht geladen werden');
    const tiles = await res.json();

    renderTiles(tiles, 'all');
    setupSidebarFilters(tiles);
  } catch (error) {
    console.error('Fehler beim Laden der Kacheln:', error);
  }
}

function renderTiles(tiles, category) {
  const container = document.querySelector('.grid-container');
  container.innerHTML = '';

  let filteredTiles;
  if (category === 'all' || !category) {
    filteredTiles = tiles;
  } else {
    filteredTiles = tiles.filter(t => t.category === category);
  }

  filteredTiles.forEach(tile => {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = tile.link || '#';

    const img = document.createElement('img');
    img.src = tile.image;
    img.alt = tile.title || '';

    a.appendChild(img);

    const divContent = document.createElement('div');
    divContent.className = 'card_content';

    const h3 = document.createElement('h3');
    h3.className = 'card_title';
    h3.textContent = tile.title || '';

    const p = document.createElement('p');
    p.className = 'card_desc';
    p.textContent = tile.text || '';

    divContent.appendChild(h3);
    divContent.appendChild(p);
    a.appendChild(divContent);

    container.appendChild(a);
  });
}

function setupSidebarFilters(tiles) {
  const filterLinks = document.querySelectorAll('.browse_filters .filter-btn');
  if (!filterLinks.length) return;

  filterLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      // Kategorie aus data-filter Attribut holen
      const category = link.dataset.filter;

      // Aktiven Button hervorheben
      filterLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Tiles filtern
      renderTiles(tiles, category);
    });
  });

  // Optional: Standard "Alle" aktiv setzen, falls vorhanden
  const allBtn = Array.from(filterLinks).find(l => l.dataset.filter === 'all');
  if (allBtn) {
    allBtn.classList.add('active');
  }
}

window.addEventListener('DOMContentLoaded', loadTiles);
