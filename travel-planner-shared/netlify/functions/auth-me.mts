import type { Config } from "@netlify/functions";
import { db, json, currentUser } from "./_auth.mts";
export default async (req:Request)=>{
 const d=db(); const c:any[]=await d.sql`SELECT COUNT(*)::int AS count FROM app_users`; const count=Number(c[0]?.count||0);
 const user:any=await currentUser(req); let inviteCode:null|string=null;
 if(user?.role==="admin" && count<2){ const s:any[]=await d.sql`SELECT invite_code FROM app_settings WHERE id=1`; inviteCode=s[0]?.invite_code||null; }
 return json({user,count,needsSetup:count===0,canJoin:count===1,inviteCode});
};
export const config:Config={path:"/api/auth/me"};
