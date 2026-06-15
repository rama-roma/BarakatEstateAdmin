import { authenticateUser } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");

  const user = await authenticateUser(username, password);

  if (!user) {
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  return Response.json({ user });
}
