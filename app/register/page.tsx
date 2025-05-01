import AcmeLogo from "@/app/ui/acme-logo";
import RegisterForm from "@/app/ui/auth/register-form";

export default function RegisterPage() {
  // Log environment variables in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Register Page Environment Variables:', {
      POSTGRES_URL: process.env.POSTGRES_URL ? 'exists' : 'missing',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'exists' : 'missing',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'exists' : 'missing',
      POSTGRES_USER: process.env.POSTGRES_USER ? 'exists' : 'missing',
      POSTGRES_HOST: process.env.POSTGRES_HOST ? 'exists' : 'missing',
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? 'exists' : 'missing'
    });
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
