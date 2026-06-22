import { updateUserProfile } from "@/lib/store";
import { profileUpdateSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { jsonResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse({ error: "Ошибка валидации", details: parsed.error.format() }, 400);
  }

  const user = await updateUserProfile(session.userId, parsed.data);

  if (!user) {
    return jsonResponse({ error: "Пользователь не найден" }, 404);
  }

  return jsonResponse({ user });
}
