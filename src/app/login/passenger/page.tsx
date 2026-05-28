import AuthForm from "@/components/auth/AuthForm";

export default function PassengerLoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_-10%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <AuthForm
          role="passenger"
          title="Passenger"
          subtitle="Sign in or create an account to request rides, book seats, and pay through escrow."
          accentClass="bg-emerald-400"
        />
      </div>
    </main>
  );
}

