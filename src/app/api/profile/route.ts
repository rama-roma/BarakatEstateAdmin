export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

function targetUrl() {
  return new URL("/api/profile", backendUrl).toString();
}

function proxyHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (process.env.ADMIN_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.ADMIN_API_TOKEN}`;
  }

  return headers;
}

export async function OPTIONS(request: Request) {
  const response = await fetch(targetUrl(), {
    method: "OPTIONS",
    headers: {
      Origin: request.headers.get("origin") || "http://localhost:3001",
    },
  });

  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET() {
  const response = await fetch(targetUrl(), {
    cache: "no-store",
  });
  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const response = await fetch(targetUrl(), {
    method: "PUT",
    headers: proxyHeaders(),
    body: JSON.stringify(data),
  });
  const payload = await response.json();

  return Response.json(payload, { status: response.status });
}
