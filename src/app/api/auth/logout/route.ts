import { jsonResponse } from "@/lib/api";
import { deleteSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await deleteSession();
  return jsonResponse({ message: "Успешный выход" });
}
