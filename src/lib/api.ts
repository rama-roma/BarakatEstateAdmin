import type { CollectionName } from "./types";
//
export const collections: CollectionName[] = ["listings", "employees", "services", "applications", "users", "reviews"];

export function jsonResponse(data: unknown, status = 200) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (status === 204) {
    return new Response(null, { status, headers });
  }
  return Response.json(data, { status, headers });
}

export function isCollection(value: string): value is CollectionName {
  return collections.includes(value as CollectionName);
}
