import type { Config } from "@netlify/functions";
import { db, json, hashPassword, randomToken, randomInvite, sha, sessionCookie } from "./_auth.mts";

export default async (req:Request) => {
  if(req.method !== "POST") return json({error:"Method not allowed"},405);
  const body:any = await req.json().catch(()=>({}));
  const name=String(body.name||"").trim(), email=String(body.email||"").trim().toLowerCase(), password=String(body.password||""), invite=String(body.inviteCode||"").trim().toUpperCase();
  if(name.length<2 || !email.includes("@") || password.length<6) return json({error:"Заполните имя, email и пароль (минимум 6 символов)."},400);
  const d=db();
  const countRows:any[]=await d.sql`SELECT COUNT(*)::int AS count FROM app_users`;
  const count=Number(countRows[0]?.count||0);
  if(count>=2) return json({error:"В приложении уже зарегистрированы два пользователя."},403);
  if(count===1){
    const s:any[]=await d.sql`SELECT invite_code FROM app_settings WHERE id=1`;
    if(!invite || invite!==String(s[0]?.invite_code||"").toUpperCase()) return json({error:"Неверный код приглашения."},403);
  }
  const role = count===0 ? "admin" : "editor";
  try{
    const users:any[]=await d.sql`INSERT INTO app_users(name,email,password_hash,role) VALUES(${name},${email},${hashPassword(password)},${role}) RETURNING id,name,email,role`;
    const user=users[0];
    if(count===0){ const code=randomInvite(); await d.sql`UPDATE app_settings SET invite_code=${code},updated_at=NOW() WHERE id=1`; }
    else { await d.sql`UPDATE app_settings SET invite_code=NULL,updated_at=NOW() WHERE id=1`; }
    const token=randomToken(); await d.sql`INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES(${user.id},${sha(token)},NOW()+INTERVAL '30 days')`;
    return json({user},{status:201,headers:{"Set-Cookie":sessionCookie(token)}});
  }catch(e:any){
    if(String(e).toLowerCase().includes("unique")) return json({error:"Пользователь с таким email уже существует."},409);
    return json({error:"Не удалось создать пользователя."},500);
  }
};
export const config:Config={path:"/api/auth/register"};
