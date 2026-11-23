import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = process.env.TEST_PRODUCTS_FILE || path.join(__dirname, 'data/db.json');
const usersFile = process.env.TEST_USERS_FILE || path.join(__dirname, 'data/users.json');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : [];
let nextOrderId = 1;
if (!users.some(u => u.role === 'admin') && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  users.push({ id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, name: 'Администратор', email: process.env.ADMIN_EMAIL.toLowerCase(), password_hash: adminHash, role: 'admin' });
  saveUsers();
}
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'test') app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут' }, standardHeaders: 'draft-8', legacyHeaders: false });
function saveUsers() { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); }
function tokenFor(user) { return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }); }
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Требуется вход в систему' });
  try { const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET); req.user = users.find(u => String(u.id) === String(payload.sub)); if (!req.user) return res.status(401).json({ error: 'Пользователь не найден' }); next(); }
  catch { return res.status(401).json({ error: 'Недействительный токен' }); }
}
export function requireRole(role) { return (req, res, next) => req.user?.role === role ? next() : res.status(403).json({ error: 'Недостаточно прав' }); }
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/products', (_req, res) => res.json(db.products));
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Имя, корректный email и пароль минимум 8 символов обязательны' });
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Этот e-mail уже зарегистрирован' });
  const user = { id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, name: name.trim(), email: email.toLowerCase(), password_hash: await bcrypt.hash(password, 10), role: 'user' };
  users.push(user); saveUsers();
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.status(201).json({ user: safeUser, token: tokenFor(user) });
});
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Укажите e-mail и пароль' });
  const user = users.find(u => u.email === String(email).toLowerCase());
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) return res.status(401).json({ error: 'Неверный e-mail или пароль' });
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: safeUser, token: tokenFor(user) });
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role }));
app.post('/api/products', requireAuth, requireRole('admin'), (req, res) => {
  const { name, price, image } = req.body || {};
  if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) return res.status(400).json({ error: 'Название и цена больше нуля обязательны' });
  const product = { id: Math.max(0, ...db.products.map(p => Number(p.id))) + 1, name: name.trim(), price: Number(price), image: image || 'https://placehold.co/300x200?text=AgroMarket' };
  db.products.push(product); fs.writeFileSync(dataFile, JSON.stringify(db, null, 2)); res.status(201).json(product);
});
app.delete('/api/products/:id', requireAuth, requireRole('admin'), (req, res) => { const id = Number(req.params.id); const idx = db.products.findIndex(p => p.id === id); if (idx < 0) return res.status(404).json({ error: 'Товар не найден' }); db.products.splice(idx, 1); fs.writeFileSync(dataFile, JSON.stringify(db, null, 2)); res.status(204).end(); });
app.post('/api/orders', (req, res) => {
  const { name, email, quantity } = req.body ?? {};
  if (!name || !email || !String(email).includes('@') || !Number.isFinite(Number(quantity)) || Number(quantity) < 10) return res.status(400).json({ error: 'Укажите имя, корректный email и объём заказа не менее 10 кг.' });
  return res.status(201).json({ id: nextOrderId++, message: 'Заявка принята', order: req.body });
});
app.get('/api/orders', requireAuth, requireRole('admin'), (_req, res) => res.json([]));
app.use((err, _req, res, _next) => { if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' }); if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' }); console.error(err); res.status(500).json({ error: 'Внутренняя ошибка сервера' }); });
export default app;
