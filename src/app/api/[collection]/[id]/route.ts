import { deleteItem, updateItem } from "@/lib/store";
import { isCollection, jsonResponse } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return jsonResponse(null, 204);
}

type CollectionItemContext = {
  params: Promise<{ collection: string; id: string }>;
};

async function verifyOwnership(collection: string, id: string, session: any) {
  if (session.role === "admin") return true;
  
  if (collection === "listings") {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return false;
    return listing.sellerId === session.userId;
  }
  
  // Non-admins shouldn't modify employees/services in SaaS mode
  return false;
}

export async function PATCH(request: Request, context: CollectionItemContext) {
  const { collection, id } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  const isOwner = await verifyOwnership(collection, id, session);
  if (!isOwner) {
    return jsonResponse({ error: "Нет прав для редактирования" }, 403);
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

  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  const isOwner = await verifyOwnership(collection, id, session);
  if (!isOwner) {
    return jsonResponse({ error: "Нет прав для удаления" }, 403);
  }

  const deleted = await deleteItem(collection, id);

  if (!deleted) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  return jsonResponse({ ok: true });
}
