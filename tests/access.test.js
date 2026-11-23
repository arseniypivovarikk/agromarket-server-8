import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
const unique=()=>`user${Date.now()}${Math.floor(Math.random()*9999)}@test.kz`;
async function token(email,password='qwerty123') { const r=await request(app).post('/api/auth/register').send({name:'Buyer',email,password}); return r.body.token; }
async function adminToken() { const r=await request(app).post('/api/auth/login').send({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}); return r.body.token; }
describe('Role access', () => {
 it('product creation requires authentication (401)', async()=>{ const r=await request(app).post('/api/products').send({name:'test',price:123}); expect(r.status).toBe(401); });
 it('buyer cannot create products (403)', async()=>{ const t=await token(unique()); const r=await request(app).post('/api/products').set('Authorization',`Bearer ${t}`).send({name:'test',price:123}); expect(r.status).toBe(403); });
 it('admin is allowed to create product', async()=>{ const t=await adminToken(); const r=await request(app).post('/api/products').set('Authorization',`Bearer ${t}`).send({name:'Lab8 test product',price:100}); expect(r.status).toBe(201); expect(r.body.name).toBe('Lab8 test product'); });
 it('orders endpoint is admin-only', async()=>{ const buyer=await token(unique()); const denied=await request(app).get('/api/orders').set('Authorization',`Bearer ${buyer}`); expect(denied.status).toBe(403); const admin=await adminToken(); const allowed=await request(app).get('/api/orders').set('Authorization',`Bearer ${admin}`); expect(allowed.status).toBe(200); expect(Array.isArray(allowed.body)).toBe(true); });
});
