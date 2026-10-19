const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

const ROOT_DIR = path.resolve(__dirname, '..');
const MEMORIES_FILE = path.join(ROOT_DIR, 'memories.json');
const IMAGES_DIR = path.join(ROOT_DIR, 'assets', 'images', 'memories');

// Ensure image upload directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Multer storage configuration with unique timestamp to prevent caching
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const slot = req.params.slot; // e.g. "day1", "day15", "e1"
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    cb(null, `${slot}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|heic/i;
    const isValid = allowed.test(path.extname(file.originalname)) || allowed.test(file.mimetype);
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed.'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Serve the admin panel
app.use('/admin', express.static(path.join(ROOT_DIR, 'admin')));

// Serve the entire static website
app.use(express.static(ROOT_DIR));

// Helper: read memories.json
function getMemoriesData() {
  const raw = fs.readFileSync(MEMORIES_FILE, 'utf8');
  return JSON.parse(raw);
}

// Helper: save memories.json
function saveMemoriesData(data) {
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Helper: find slot in data
function findSlotItem(data, slot) {
  if (slot.startsWith('day')) {
    const dayNum = parseInt(slot.replace('day', ''), 10);
    return data.memories.find(m => m.day === dayNum);
  } else if (slot.startsWith('e')) {
    return data.exclusives.find(e => e.id === slot);
  }
  return null;
}

// GET all memories & configuration
app.get('/api/memories', (req, res) => {
  try {
    const data = getMemoriesData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read memories.json', details: err.message });
  }
});

// POST update memory slot details (title, story, yearsAgo, images)
app.post('/api/memories/:slot', (req, res) => {
  try {
    const { slot } = req.params;
    const { title, story, yearsAgo, image, images } = req.body;
    const data = getMemoriesData();
    const item = findSlotItem(data, slot);

    if (!item) {
      return res.status(404).json({ error: `Slot ${slot} not found` });
    }

    if (title !== undefined) item.title = title;
    if (story !== undefined) item.story = story;
    if (yearsAgo !== undefined) item.yearsAgo = yearsAgo;

    if (images !== undefined && Array.isArray(images)) {
      item.images = images.filter(Boolean);
      item.image = item.images[0] || '';
    } else if (image !== undefined) {
      item.image = image;
      item.images = item.images && item.images.length > 0 ? item.images : (image ? [image] : []);
    }

    saveMemoriesData(data);
    res.json({ success: true, message: `Slot ${slot} updated successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slot', details: err.message });
  }
});

// POST upload photo for a specific slot (supports add or replace)
app.post('/api/upload/:slot', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { slot } = req.params;
    const { action, index } = req.body;
    const relativePath = `assets/images/memories/${req.file.filename}`;
    const data = getMemoriesData();
    const item = findSlotItem(data, slot);

    if (!item) {
      return res.status(404).json({ error: `Slot ${slot} not found` });
    }

    // Ensure images array exists
    item.images = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);

    const targetIdx = index !== undefined && index !== '' ? parseInt(index, 10) : -1;

    if (action === 'replace' && targetIdx >= 0 && targetIdx < item.images.length) {
      // Replace existing photo at index
      item.images[targetIdx] = relativePath;
    } else if (action === 'add' || targetIdx === -1) {
      // Append photo to slideshow
      item.images.push(relativePath);
    } else if (targetIdx >= 0 && targetIdx < item.images.length) {
      item.images[targetIdx] = relativePath;
    } else {
      item.images.push(relativePath);
    }

    item.image = item.images[0] || relativePath;

    saveMemoriesData(data);
    res.json({
      success: true,
      path: relativePath,
      images: item.images,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload photo', details: err.message });
  }
});

// POST delete a photo from a slot
app.post('/api/memories/:slot/delete-photo', (req, res) => {
  try {
    const { slot } = req.params;
    const { index } = req.body;
    const data = getMemoriesData();
    const item = findSlotItem(data, slot);

    if (!item) return res.status(404).json({ error: `Slot ${slot} not found` });

    item.images = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
    const idx = parseInt(index, 10);

    if (!isNaN(idx) && idx >= 0 && idx < item.images.length) {
      const removed = item.images.splice(idx, 1)[0];
      item.image = item.images[0] || '';
      saveMemoriesData(data);

      // Clean up file if present
      try {
        const fullPath = path.join(ROOT_DIR, removed);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {
        // file cleanup ignore
      }

      return res.json({ success: true, images: item.images });
    }

    res.status(400).json({ error: 'Invalid photo index' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo', details: err.message });
  }
});

// POST git commit and push to GitHub
app.post('/api/deploy', (req, res) => {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' });
    if (!status.trim()) {
      return res.json({ success: true, message: 'Everything is already up-to-date in git.' });
    }

    execSync('git add .', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git commit -m "Update birthday memories, photos, and slideshows"', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git push', { cwd: ROOT_DIR, stdio: 'pipe' });

    res.json({ success: true, message: 'Successfully committed and pushed to GitHub Pages!' });
  } catch (err) {
    res.status(500).json({
      error: 'Git push failed. Ensure your repository remote is configured and you have push access.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🎂 Dr. Nitishikha Sharma - Birthday Album Admin Server`);
  console.log(`------------------------------------------------------`);
  console.log(`✦ Main Website:  http://localhost:${PORT}/`);
  console.log(`✦ Admin Panel:   http://localhost:${PORT}/admin/`);
  console.log(`======================================================\n`);
});
