import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
describe('Catalog', () => {
 it('returns product list', async () => { const res=await request(app).get('/api/products'); expect(res.status).toBe(200); expect(Array.isArray(res.body)).toBe(true); expect(res.body.length).toBeGreaterThan(0); });
 it('product contains id/name/price', async () => { const res=await request(app).get('/api/products'); expect(res.body[0]).toHaveProperty('id'); expect(res.body[0]).toHaveProperty('name'); expect(res.body[0]).toHaveProperty('price'); });
});
