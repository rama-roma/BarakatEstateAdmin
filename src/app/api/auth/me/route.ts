import { jsonResponse } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return jsonResponse({ error: "Пользователь не найден" }, 404);
  }

  const { password: _, ...safeUser } = user;
  return jsonResponse({ user: safeUser });
}
