import type { Config } from "@netlify/functions";
import { db, json, currentUser } from "./_auth.mts";

const DEFAULT_STATE={selected:"t1",trips:[
{id:"t1",name:"Sri Lanka — Вариант 1 (Abu Dhabi)",start:"2026-12-25",end:"2027-01-11",travellers:4,currency:"USD",segments:[
{id:"a1",type:"Самолёт",from:"Ереван",to:"Абу-Даби",depart:"2026-12-25T18:30",departTz:"Asia/Yerevan",arrive:"2026-12-25T21:45",arriveTz:"Asia/Dubai",cost:2800,currency:"USD",notes:"4×7 кг ручная кладь · 2×20 кг багаж · места +",paid:false},
{id:"a2",type:"Самолёт",from:"Абу-Даби",to:"Коломбо",depart:"2026-12-26T14:45",departTz:"Asia/Dubai",arrive:"2026-12-26T20:40",arriveTz:"Asia/Colombo",cost:0,currency:"USD",notes:"17 часов ожидания — отель рекомендуется",paid:false},
{id:"a3",type:"Самолёт",from:"Коломбо",to:"Абу-Даби",depart:"2027-01-10T21:55",departTz:"Asia/Colombo",arrive:"2027-01-11T01:15",arriveTz:"Asia/Dubai",cost:0,currency:"USD",notes:"",paid:false},
{id:"a4",type:"Самолёт",from:"Абу-Даби",to:"Ереван",depart:"2027-01-11T09:00",departTz:"Asia/Dubai",arrive:"2027-01-11T12:20",arriveTz:"Asia/Yerevan",cost:0,currency:"USD",notes:"7 ч 45 мин ожидания — hotel / lounge",paid:false}],expenses:[]},
{id:"t2",name:"Sri Lanka — Вариант 2 (Sharjah)",start:"2026-12-24",end:"2027-01-11",travellers:4,currency:"USD",segments:[
{id:"b1",type:"Самолёт",from:"Ереван",to:"Шарджа",depart:"2026-12-24T12:15",departTz:"Asia/Yerevan",arrive:"2026-12-24T15:15",arriveTz:"Asia/Dubai",cost:3050,currency:"USD",notes:"4×7 кг ручная кладь · 2×20 кг багаж · места +",paid:false},
{id:"b2",type:"Самолёт",from:"Шарджа",to:"Коломбо",depart:"2026-12-24T19:50",departTz:"Asia/Dubai",arrive:"2026-12-25T01:50",arriveTz:"Asia/Colombo",cost:0,currency:"USD",notes:"Пересадка 4 ч 35 мин",paid:false},
{id:"b3",type:"Самолёт",from:"Коломбо",to:"Абу-Даби",depart:"2027-01-10T21:55",departTz:"Asia/Colombo",arrive:"2027-01-11T01:15",arriveTz:"Asia/Dubai",cost:0,currency:"USD",notes:"",paid:false},
{id:"b4",type:"Самолёт",from:"Абу-Даби",to:"Ереван",depart:"2027-01-11T09:00",departTz:"Asia/Dubai",arrive:"2027-01-11T12:20",arriveTz:"Asia/Yerevan",cost:0,currency:"USD",notes:"7 ч 45 мин ожидания — hotel / lounge",paid:false}],expenses:[]}
]};

export default async(req:Request)=>{
 const user:any=await currentUser(req); if(!user) return json({error:"Unauthorized"},401);
 const d=db();
 if(req.method==="GET"){
   let rows:any[]=await d.sql`SELECT data,version,updated_at FROM app_state WHERE id=1`;
   if(!rows.length){ rows=await d.sql`INSERT INTO app_state(id,data,version,updated_by) VALUES(1,${JSON.stringify(DEFAULT_STATE)}::jsonb,1,${user.id}) RETURNING data,version,updated_at`; }
   return json({state:rows[0].data,version:Number(rows[0].version),updatedAt:rows[0].updated_at});
 }
 if(req.method==="PUT"){
   const b:any=await req.json().catch(()=>({})); if(!b.state) return json({error:"Missing state"},400);
   const clientVersion=Number(b.version||0); const current:any[]=await d.sql`SELECT version FROM app_state WHERE id=1`; const serverVersion=Number(current[0]?.version||0);
   if(serverVersion && clientVersion && clientVersion!==serverVersion) return json({error:"conflict",serverVersion},409);
   const next=serverVersion?serverVersion+1:1;
   const rows:any[]=await d.sql`INSERT INTO app_state(id,data,version,updated_by,updated_at) VALUES(1,${JSON.stringify(b.state)}::jsonb,${next},${user.id},NOW()) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,version=EXCLUDED.version,updated_by=EXCLUDED.updated_by,updated_at=NOW() RETURNING version,updated_at`;
   return json({ok:true,version:Number(rows[0].version),updatedAt:rows[0].updated_at});
 }
 return json({error:"Method not allowed"},405);
};
export const config:Config={path:"/api/state"};
