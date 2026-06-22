import { jsonResponse } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: "Слишком много попыток. Попробуйте позже." }, 429);
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonResponse({ error: "Ошибка валидации", details: parsed.error.format() }, 400);
    }
    
    const data = parsed.data;
    
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });
    
    if (existingUser) {
      return jsonResponse({ error: "Пользователь с таким логином уже существует" }, 409);
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        whatsapp: "",
        telegram: "",
        instagram: "",
        facebook: "",
        avatar: "",
        bio: "",
        rating: 5,
        dealsCount: 0,
        experienceYears: 0,
        specializations: "",
        role: "user",
      },
    });
    
    await createSession(user);
    
    const { password: _, ...safeUser } = user;
    return jsonResponse({ message: "Успешная регистрация", user: safeUser }, 201);
  } catch (error: any) {
    console.error("Register Error:", error);
    return jsonResponse({ error: "Внутренняя ошибка сервера", details: error?.message || String(error) }, 500);
  }
}
