import { deleteItem, updateItem } from "@/lib/store";
import { isCollection, jsonResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return jsonResponse(null, 204);
}

type CollectionItemContext = {
  params: Promise<{ collection: string; id: string }>;
};

export async function PATCH(request: Request, context: CollectionItemContext) {
  const { collection, id } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const data = await request.json();
  const item = await updateItem(collection, id, data);

  if (!item) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  return jsonResponse({ data: item });
}

export async function DELETE(_request: Request, context: CollectionItemContext) {
  const { collection, id } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const deleted = await deleteItem(collection, id);

  if (!deleted) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  return jsonResponse({ ok: true });
}
