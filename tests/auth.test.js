import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
const email = () => `test${Date.now()}${Math.floor(Math.random()*10000)}@test.kz`;
describe('Auth endpoints', () => {
 it('registers a regular user and returns JWT', async () => { const res=await request(app).post('/api/auth/register').send({name:'Test user',email:email(),password:'qwerty123',role:'admin'}); expect(res.status).toBe(201); expect(res.body.token.split('.')).toHaveLength(3); expect(res.body.user.role).toBe('user'); expect(res.body.user).not.toHaveProperty('password_hash'); });
 it('rejects too-short password', async () => { const res=await request(app).post('/api/auth/register').send({name:'Test',email:email(),password:'123'}); expect(res.status).toBe(400); });
 it('normalizes email to lowercase', async () => { const addr=`Test${Date.now()}@Mail.KZ`; const res=await request(app).post('/api/auth/register').send({name:'Test',email:addr,password:'qwerty123'}); expect(res.status).toBe(201); expect(res.body.user.email).toBe(addr.toLowerCase()); });
 it('duplicate email returns 409', async () => { const body={name:'Dup',email:email(),password:'qwerty123'}; await request(app).post('/api/auth/register').send(body); const res=await request(app).post('/api/auth/register').send(body); expect(res.status).toBe(409); });
 it('admin can login and token is three parts', async () => { const res=await request(app).post('/api/auth/login').send({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}); expect(res.status).toBe(200); expect(res.body.token.split('.')).toHaveLength(3); expect(res.body.user.role).toBe('admin'); });
 it('invalid credentials return 401', async () => { const res=await request(app).post('/api/auth/login').send({email:email(),password:'wrong'}); expect(res.status).toBe(401); });
 it('me endpoint requires token', async () => { const res=await request(app).get('/api/auth/me'); expect(res.status).toBe(401); });
 it('me endpoint returns authenticated user without password hash', async () => { const reg=await request(app).post('/api/auth/register').send({name:'Me',email:email(),password:'qwerty123'}); const res=await request(app).get('/api/auth/me').set('Authorization',`Bearer ${reg.body.token}`); expect(res.status).toBe(200); expect(res.body.email).toBe(reg.body.user.email); expect(res.body).not.toHaveProperty('password_hash'); });
});
