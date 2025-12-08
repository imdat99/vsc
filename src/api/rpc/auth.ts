import { getContext } from "hono/context-storage";
import {
    setCookie
} from 'hono/cookie';
import { sign } from "hono/jwt";
import { HonoVarTypes } from "types";
import { secret } from "./commom";
interface RegisterModel {
    username: string;
    password: string;
    email: string;
}
const register = async (registerModel: RegisterModel) => {
    return true
};
const login = async (username: string, password: string) => {
    const context = getContext<HonoVarTypes>();
    const sub = crypto.randomUUID();
    const iat = Math.floor(Date.now() / 1000);
    const jti = generateRandomString(16);
    const exp = iat + 60 * 20; // 20 minutes expiration
    const token = await sign({ username, password, jti, exp, iat, iss: "ez.lms", aud: "ez.lms_users", sub, }, secret);
    const redis = context.get("redis");
    
    redis.setex(`auth_token:${jti}`, 60 * 20, "1");
    setCookie(context, 'auth_token', token, { httpOnly: true, secure: true, sameSite: "Lax", path: '/', maxAge: 60 * 20 });
    return null;
}
async function checkAuth() {
    const c = getContext<HonoVarTypes>();
    const redis = c.get("redis");
    const result = await redis.ttl(`auth_token:${c.get("jwtPayload").jti}`)
    return result; 
}
export const authMethods = {
    register,
    login,
    checkAuth,
}
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
async function hashString(input: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const inputData = encoder.encode(input);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        inputData
    );

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}