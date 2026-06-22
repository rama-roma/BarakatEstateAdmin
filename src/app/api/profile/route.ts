import { jsonResponse } from "@/lib/api";
import { readProfile, writeProfile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return jsonResponse(null, 204);
}

export async function GET() {
  return jsonResponse({ data: await readProfile() });
}

export async function PUT(request: Request) {
  const data = await request.json();
  return jsonResponse({ data: await writeProfile(data) });
}
