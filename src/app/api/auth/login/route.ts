import { jsonResponse } from "@/lib/api";
import { authenticateUser } from "@/lib/store";
import { loginSchema } from "@/lib/validations";
import { createSession, checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: "Слишком много попыток. Попробуйте позже." }, 429);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonResponse({ error: "Ошибка валидации", details: parsed.error.format() }, 400);
    }
    
    const { username, password } = parsed.data;
    const user = await authenticateUser(username, password);

    if (!user) {
      return jsonResponse({ error: "Неверный логин или пароль" }, 401);
    }
    
    // Create JWT session cookie
    await createSession(user as any); // authUser type mismatch with User but both have id and role

    return jsonResponse({ user });
  } catch (error: any) {
    console.error("Login Error:", error);
    return jsonResponse({ error: "Внутренняя ошибка сервера", details: error?.message || String(error) }, 500);
  }
}
