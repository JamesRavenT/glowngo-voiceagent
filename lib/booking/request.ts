import { NextResponse } from "next/server";
import type { ErrorResponse } from "@/lib/booking/types";

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new RequestBodyError("Request body must be valid JSON"); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new RequestBodyError("Request body must be a JSON object");
  return body as Record<string, unknown>;
}

export class RequestBodyError extends Error {}

export function requireString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") throw new RequestBodyError(`${key} must be a non-empty string`);
  return value;
}

export function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") throw new RequestBodyError(`${key} must be a non-empty string when provided`);
  return value;
}

export function errorResponse(error: unknown): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : "Invalid request";
  return NextResponse.json({ error: message }, { status: 400 });
}
