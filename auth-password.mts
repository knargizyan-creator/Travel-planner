import type { Config } from "@netlify/functions";
import { db, json, currentUser, hashPassword } from "./_auth.mts";

export default async (req:Request)=>{
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  const user:any=await currentUser(req);
  if(!user) return json({error:"Необходимо войти в аккаунт."},401);
  const body:any=await req.json().catch(()=>({}));
  const password=String(body.password||"");
  if(password.length<6) return json({error:"Пароль должен содержать минимум 6 символов."},400);
  const d=db();
  await d.sql`UPDATE app_users SET password_hash=${hashPassword(password)} WHERE id=${user.id}`;
  return json({ok:true});
};
export const config:Config={path:"/api/auth/password"};
