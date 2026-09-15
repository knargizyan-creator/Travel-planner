import { getDatabase } from "@netlify/database";
import crypto from "node:crypto";

export const db = () => getDatabase();
export const json = (data: unknown, status = 200, headers: Record<string,string> = {}) => Response.json(data, { status, headers });
export const sha = (v:string) => crypto.createHash("sha256").update(v).digest("hex");
export const randomToken = () => crypto.randomBytes(32).toString("base64url");
export const randomInvite = () => crypto.randomBytes(4).toString("hex").toUpperCase();
export const hashPassword = (password:string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
export const verifyPassword = (password:string, stored:string) => {
  const [salt, hash] = stored.split(":");
  if(!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = crypto.scryptSync(password, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
};
export function cookieToken(req:Request){
  const raw = req.headers.get("cookie") || "";
  const m = raw.match(/(?:^|;\s*)tp_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
export async function currentUser(req:Request){
  const token = cookieToken(req); if(!token) return null;
  const d = db();
  const rows:any[] = await d.sql`
    SELECT u.id, u.name, u.email, u.role
    FROM app_sessions s JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=${sha(token)} AND s.expires_at > NOW()
    LIMIT 1`;
  return rows[0] || null;
}
export const sessionCookie = (token:string) => `tp_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
export const clearCookie = () => `tp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
