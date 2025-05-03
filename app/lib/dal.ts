import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { decrypt } from "@/app/actions/session";
import { sql } from "@vercel/postgres";
import type { User } from "@/app/lib/definitions";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return { isAuth: false, userId: null };
  }

  return { isAuth: true, userId: session.userId };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) return null;

  try {
    const user = await sql<User>`SELECT * FROM users WHERE id=${session.userId as string}`;
    return user.rows[0];
  } catch (error) {
    console.log("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
});
