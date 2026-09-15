import type { Config } from "@netlify/functions";
import { db, json, verifyPassword, randomToken, sha, sessionCookie } from "./_auth.mts";
export default async (req:Request)=>{
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 const b:any=await req.json().catch(()=>({})); const email=String(b.email||"").trim().toLowerCase(), password=String(b.password||"");
 const d=db(); const rows:any[]=await d.sql`SELECT id,name,email,role,password_hash FROM app_users WHERE email=${email} LIMIT 1`; const u=rows[0];
 if(!u || !verifyPassword(password,u.password_hash)) return json({error:"Неверный email или пароль."},401);
 const token=randomToken(); await d.sql`DELETE FROM app_sessions WHERE expires_at <= NOW()`; await d.sql`INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES(${u.id},${sha(token)},NOW()+INTERVAL '30 days')`;
 return json({user:{id:u.id,name:u.name,email:u.email,role:u.role}},200,{"Set-Cookie":sessionCookie(token)});
};
export const config:Config={path:"/api/auth/login"};
