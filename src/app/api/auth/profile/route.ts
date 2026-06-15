import { updateUserProfile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const body = await request.json();
  const userId = String(body.userId || "");

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const user = await updateUserProfile(userId, body);

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
}
