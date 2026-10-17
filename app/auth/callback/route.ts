
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const destination = new URL("/reset-password", url.origin);

  if (code) {
    destination.searchParams.set("code", code);
  }

  return NextResponse.redirect(destination);
}
