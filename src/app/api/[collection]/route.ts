import { createItem, getPublicPayload, listItems } from "@/lib/store";
import { isCollection, jsonResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return jsonResponse(null, 204);
}

type CollectionContext = {
  params: Promise<{ collection: string }>;
};

export async function GET(request: Request, context: CollectionContext) {
  const { collection } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const url = new URL(request.url);
  const adminMode = url.searchParams.get("admin") === "1";

  if (adminMode) {
    return jsonResponse({ data: await listItems(collection) });
  }

  return jsonResponse(await getPublicPayload(collection));
}

export async function POST(request: Request, context: CollectionContext) {
  const { collection } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const data = await request.json();
  const item = await createItem(collection, data);
  return jsonResponse({ data: item }, 201);
}
