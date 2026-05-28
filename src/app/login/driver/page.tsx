import AuthForm from "@/components/auth/AuthForm";

export default function DriverLoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(34,211,238,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <AuthForm
          role="driver"
          title="Driver"
          subtitle="Sign in or create an account to accept requests and manage your ride availability."
          accentClass="bg-cyan-400"
        />
      </div>
    </main>
  );
}

