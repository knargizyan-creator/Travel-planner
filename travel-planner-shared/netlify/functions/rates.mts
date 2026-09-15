import type { Context, Config } from "@netlify/functions";

const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><ExchangeRatesLatest xmlns="http://www.cba.am/" /></soap:Body>
</soap:Envelope>`;

function tag(block:string,name:string){const m=block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`,'i'));return m?.[1]?.trim()||''}

export default async (_req:Request,_ctx:Context) => {
  try{
    const res=await fetch('https://api.cba.am/exchangerates.asmx',{
      method:'POST',headers:{'Content-Type':'text/xml; charset=utf-8','SOAPAction':'"http://www.cba.am/ExchangeRatesLatest"'},body:soap
    });
    if(!res.ok) throw new Error(`CBA ${res.status}`);
    const xml=await res.text();
    const current=tag(xml,'CurrentDate');
    const entries=[...xml.matchAll(/<ExchangeRate>([\s\S]*?)<\/ExchangeRate>/gi)];
    const rates:Record<string,number>={};
    for(const e of entries){const b=e[1];const iso=tag(b,'ISO');const amount=Number(tag(b,'Amount').replace(',','.'))||1;const rate=Number(tag(b,'Rate').replace(',','.'));if(iso&&Number.isFinite(rate))rates[iso]=rate/amount}
    if(!rates.USD) throw new Error('USD missing');
    const d=current?new Date(current):new Date();
    const date=new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Yerevan'}).format(d);
    return Response.json({date,source:'CBA',rates,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=1800, s-maxage=1800'}})
  }catch(err){
    return Response.json({error:'CBA temporarily unavailable',message:String(err)},{status:502});
  }
}

export const config:Config={path:'/api/rates'};
