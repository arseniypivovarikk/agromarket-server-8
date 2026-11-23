import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../app.js';
function mockRes(){ const res={}; res.status=vi.fn(()=>res); res.json=vi.fn(()=>res); return res; }
describe('middleware unit tests',()=>{
 it('requireRole allows admin',()=>{ const req={user:{role:'admin'}},res=mockRes(),next=vi.fn(); requireRole('admin')(req,res,next); expect(next).toHaveBeenCalledOnce(); expect(res.status).not.toHaveBeenCalled(); });
 it('requireRole denies non-admin with 403',()=>{ const req={user:{role:'user'}},res=mockRes(),next=vi.fn(); requireRole('admin')(req,res,next); expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled(); });
 it('requireAuth without bearer returns 401',()=>{ const res=mockRes(),next=vi.fn(); requireAuth({headers:{}},res,next); expect(res.status).toHaveBeenCalledWith(401); });
 it('requireAuth accepts valid token and sets user',()=>{ const token=jwt.sign({sub:'1',role:'admin'},process.env.JWT_SECRET); const req={headers:{authorization:`Bearer ${token}`}}; const next=vi.fn(); requireAuth(req,mockRes(),next); expect(next).toHaveBeenCalledOnce(); expect(req.user.role).toBe('admin'); });
});
