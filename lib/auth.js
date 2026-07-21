import crypto from "node:crypto";
import { SESSION_SECRET, SESSION_HOURS } from "./config.js";
import { findUserByEmail } from "./db.js";

const COOKIE = "hawcus_admin";

/* ---------- password hashing (scrypt, from node:crypto) ---------- */

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- signed session cookies (stateless) ---------- */

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function createSessionCookie(user) {
  const payload = Buffer.from(
    JSON.stringify({
      uid: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + SESSION_HOURS * 3600 * 1000,
    })
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const maxAge = SESSION_HOURS * 3600;
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/* Returns the session payload, or null when missing, tampered with, or expired. */
export function readSession(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.pass_salt, user.pass_hash)) return null;
  return user;
}

/* A stable-but-anonymous visitor id: no raw IP is ever stored. */
export function visitorId(req) {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const ua = req.headers["user-agent"] || "";
  return crypto.createHash("sha256").update(ip + "|" + ua + "|" + SESSION_SECRET).digest("hex").slice(0, 32);
}
