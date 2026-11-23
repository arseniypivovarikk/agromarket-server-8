import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true, quiet: true });
export default defineConfig({ test: { env: process.env, setupFiles: ['./tests/setup.js'], fileParallelism: false, coverage: { include: ['app.js'] } } });
