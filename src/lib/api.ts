import type { CollectionName } from "./types";

export const collections: CollectionName[] = ["listings", "employees", "services"];

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export function isCollection(value: string): value is CollectionName {
  return collections.includes(value as CollectionName);
}
