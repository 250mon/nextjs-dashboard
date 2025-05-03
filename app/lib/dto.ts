import "server-only";
import { getUser } from "@/app/lib/dal";
import { User } from "@/app/lib/definitions";
import { sql } from "@vercel/postgres";

function canSeeUsername(viewer: User) {
  console.log("viewer", viewer);
  return true;
}

function canSeeEmail(viewer: User, team: string) {
  return viewer.isadmin || team === viewer.team;
}

function canSeeTeam(viewer: User, team: string) {
  return viewer.isadmin || team === viewer.team;
}

function canSeeIsadmin(viewer: User, team: string) {
  return viewer.isadmin || team === viewer.team;
}

export async function getProfileDTO(slug: string) {
  try {
    const result = await sql<User>`
      SELECT id, name, email, password, slug, isadmin, team FROM users 
      WHERE slug = ${slug}
    `;
    
    const user = result.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    const currentUser = await getUser();
    console.log("currentUser", currentUser);

    if (!currentUser) {
      throw new Error('Current user not found');
    }

    // Return only what's specific to the query here
    console.log("currentUser", currentUser);
    return {
      name: canSeeUsername(currentUser) ? user.name : null,
      email: canSeeEmail(currentUser, user.team)
        ? user.email
        : null,
      isadmin: canSeeIsadmin(currentUser, user.team)
        ? user.isadmin
        : null,
      team: canSeeTeam(currentUser, user.team)
        ? user.team
        : null,
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile');
  }
}
