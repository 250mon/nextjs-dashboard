import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cache } from "react";
import { decrypt } from "@/app/lib/session";
import { sql } from "@vercel/postgres";
import type { User } from "@/app/lib/definitions";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    NextResponse.redirect("/login");
  }

  return { isAuth: true, userId: session?.userId as string };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const user =
      await sql<User>`SELECT * FROM users WHERE id=${session.userId}`;
    return user.rows[0];
  } catch (error) {
    console.log("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
});
