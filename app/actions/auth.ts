"use server";

import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";
import { authConfig } from "@/auth.config";
import type { User } from "@/app/lib/definitions";
import { createSession, deleteSession } from "@/app/actions/session";
import { redirect } from "next/navigation";

// 1. Base sign-in schema
const signInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
});

// 2. Register schema: extend + refine
const registerSchema = signInSchema.extend({
  name: z
    .string({ required_error: "Name is required"})
    .min(3, "Password must be more than 3 characters")
    .max(100, "Password must be less than 100 characters"),
  confirm_password: z
    .string({ required_error: "Please confirm your password" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const parsedCredentials = signInSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
            await createSession(user.id);
            return user;
          }
        }

        return null;
      },
    }),
  ],
});

export async function customSignOut({ redirectTo = "/" }: { redirectTo?: string } = {}) {
  await deleteSession();
  redirect(redirectTo);
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    throw error;
  }
}

export async function signUp(
  prevState: string,
  formData: FormData,
) {
  try {
    // 1. Validate form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm_password = formData.get('confirm_password') as string;

    const parsedCredentials = registerSchema.safeParse({
      name,
      email,
      password,
      confirm_password
    });
    
    if (!parsedCredentials.success) {
      const errorMessage = Object.entries(parsedCredentials.error.flatten().fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
        .join('; ');
      return errorMessage;
    }
    
    // 2. Prepare data for insertion into database
    const hashedPassword = await bcrypt.hash(parsedCredentials.data.password, 10);

    // 3. Insert the user into the database
    let insertedUser;
    try {
      // Generate a unique slug by combining name and a unique identifier
      const baseSlug = parsedCredentials.data.name.toLowerCase().replace(/\s+/g, '-');
      const uniqueId = Math.random().toString(36).substring(2, 8); // 6 random characters
      const slug = `${baseSlug}-${uniqueId}`;

      await sql`
        INSERT INTO users (name, email, password, slug, is_admin, team)
        VALUES (
          ${parsedCredentials.data.name}, 
          ${parsedCredentials.data.email}, 
          ${hashedPassword},
          ${slug},
          false,
          'default'
        )
        RETURNING id
      `;
      
      const result = await sql<User>`
        SELECT * FROM users WHERE email = ${parsedCredentials.data.email}
      `;
      
      if (!result.rows[0]) {
        throw new Error('Failed to retrieve user after insertion');
      }
      
      insertedUser = result.rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }

    // 4. Create user session
    await createSession(insertedUser.id);
    
    // 5. Redirect user
    redirect("/dashboard");
  } catch (error) {
    // Ignore NEXT_REDIRECT errors as they are expected
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    console.error('Signup error:', error);
    return "Failed to create account";
  }
}