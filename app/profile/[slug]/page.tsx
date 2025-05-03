import { getProfileDTO } from "@/app/lib/dto";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{slug: string}>;
  // searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProfilePage({ params }: PageProps) {
  try {
    const { slug } = await params;
    const profile = await getProfileDTO(slug);

    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-6 text-2xl font-bold">User Profile</h1>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">Name:</span>
              <span className="text-gray-700">
                {profile.name || "Not available"}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">Email:</span>
              <span className="text-gray-700">
                {profile.email || "Not available"}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">Is Admin:</span>
              <span className="text-gray-700">
                {profile.isadmin ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">Team:</span>
              <span className="text-gray-700">
                {profile.team || "Not available"}
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      notFound();
    }
    throw error;
  }
} 