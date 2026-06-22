import { createItem, getPublicPayload, listItems } from "@/lib/store";
import { isCollection, jsonResponse } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";
import type { Listing } from "@/lib/types";

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
    const session = await getSession();
    if (!session) {
      return jsonResponse({ error: "Не авторизован" }, 401);
    }
    // Return all items for the user (store handles this now if we want, or here)
    const items = await listItems(collection);
    // If it's listings, only return user's listings unless admin
    if (collection === "listings" && session.role !== "admin") {
      const listings = items as unknown as Listing[];
      return jsonResponse({ data: listings.filter((item) => item.sellerId === session.userId) });
    }
    return jsonResponse({ data: items });
  }

  return jsonResponse(await getPublicPayload(collection));
}

export async function POST(request: Request, context: CollectionContext) {
  const { collection } = await context.params;

  if (!isCollection(collection)) {
    return jsonResponse({ error: "Unknown collection" }, 404);
  }

  const session = await getSession();
  if (!session) {
    return jsonResponse({ error: "Не авторизован" }, 401);
  }

  const data = await request.json();

  if (collection === "listings") {
    const parsed = listingSchema.safeParse(data);
    if (!parsed.success) {
      return jsonResponse({ error: "Ошибка валидации", details: parsed.error.format() }, 400);
    }
    // Enforce sellerId
    data.sellerId = session.userId;
  }

  const item = await createItem(collection, data);
  return jsonResponse({ data: item }, 201);
}
