import type { Config } from "@netlify/functions";
import { db, json, cookieToken, sha, clearCookie } from "./_auth.mts";
export default async (req:Request)=>{ const t=cookieToken(req); if(t){const d=db(); await d.sql`DELETE FROM app_sessions WHERE token_hash=${sha(t)}`;} return json({ok:true},200,{"Set-Cookie":clearCookie()}); };
export const config:Config={path:"/api/auth/logout"};
