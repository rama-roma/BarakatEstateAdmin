import { getPublicSeller } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type SellerContext = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(_request: Request, context: SellerContext) {
  const { id } = await context.params;
  const seller = await getPublicSeller(id);

  if (!seller) {
    return Response.json({ error: "Seller not found" }, { status: 404, headers: corsHeaders });
  }

  return Response.json({ data: seller }, { headers: corsHeaders });
}
