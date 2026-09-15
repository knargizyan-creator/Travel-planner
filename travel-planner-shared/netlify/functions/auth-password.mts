import type { Config } from "@netlify/functions";
import { db, json, currentUser, hashPassword } from "./_auth.mts";

export default async (req:Request)=>{
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  const user:any=await currentUser(req);
  if(!user) return json({error:"Сначала войдите в аккаунт."},401);
  const body:any=await req.json().catch(()=>({}));
  const next=String(body.newPassword||"");
  if(next.length<6) return json({error:"Пароль должен содержать минимум 6 символов."},400);
  const d=db();
  await d.sql`UPDATE app_users SET password_hash=${hashPassword(next)} WHERE id=${user.id}`;
  return json({ok:true});
};
export const config:Config={path:"/api/auth/password"};
