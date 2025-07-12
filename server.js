import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const uploadPath = path.join(__dirname, 'public', 'uploads');
const tilesFile = path.join(__dirname, 'tiles.json');

// Upload-Ordner erstellen, falls nicht vorhanden
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// Upload Endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei empfangen' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Liste aller Bilder im Upload-Ordner
app.get('/uploads/list', (req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Ordners' });
    // Nur Bilddateien filtern
    const images = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f))
                        .map(f => `/uploads/${f}`);
    res.json(images);
  });
});

// Tiles laden
app.get('/tiles', (req, res) => {
  fs.readFile(tilesFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Laden der Kacheln' });
    }
    res.json(JSON.parse(data));
  });
});

// Tiles speichern
app.post('/save-tiles', (req, res) => {
  const tiles = req.body;
  if (!Array.isArray(tiles)) {
    return res.status(400).json({ error: 'Erwartet ein Array von Kacheln' });
  }
  fs.writeFile(tilesFile, JSON.stringify(tiles, null, 2), err => {
    if (err) {
      console.error('Fehler beim Speichern von tiles.json:', err);
      return res.status(500).json({ error: 'Speichern fehlgeschlagen' });
    }
    res.json({ success: true });
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
