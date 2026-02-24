import express from 'express';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Hardcoded user
const USER = {
  email: 'esterbe@gmail.com',
  passwordHash: '$2b$10$GXCePKIzDKXn0J.yJVoXNO9bHj3l94nNzzkVsBU6XRYLoS.f0tqVa', // 12345
};

// Session token (regenerated on restart)
let sessionToken = null;

// Data file path: Fly volume or local fallback
const DATA_DIR = existsSync('/data') ? '/data' : join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'user-data.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readData() {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { holdings: [0, 0, 0, 0], deposit: 0 };
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data));
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !sessionToken || auth !== `Bearer ${sessionToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== USER.email) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, USER.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  sessionToken = uuidv4();
  res.json({ token: sessionToken });
});

// Get data
app.get('/api/data', requireAuth, (req, res) => {
  res.json(readData());
});

// Save data (merge with existing)
app.put('/api/data', requireAuth, (req, res) => {
  const existing = readData();
  const { holdings, deposit } = req.body;
  if (holdings !== undefined) existing.holdings = holdings;
  if (deposit !== undefined) existing.deposit = deposit;
  writeData(existing);
  res.json({ ok: true });
});

// Serve static files
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
