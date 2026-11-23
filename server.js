import 'dotenv/config';
import app from './app.js';
if (!process.env.JWT_SECRET) { console.error('Не задан JWT_SECRET в .env'); process.exit(1); }
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`AgroMarket API запущен: http://localhost:${PORT}`));
