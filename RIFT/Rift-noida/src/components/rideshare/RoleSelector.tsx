"use client";

import type { UserRole } from "@/types";

type RoleSelectorProps = {
  onPickRole: (role: UserRole) => Promise<void>;
  isSaving: boolean;
};

function DriverIcon() {
  return (
    <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function PassengerIcon() {
  return (
    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

export default function RoleSelector({ onPickRole, isSaving }: RoleSelectorProps) {
  return (
    <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-slate-100">Choose Your Role</h3>
        <p className="mt-2 text-sm text-slate-400">Select how you want to use the app</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onPickRole("driver")}
          className="group rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-left transition hover:bg-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="mb-3">
            <DriverIcon />
          </div>
          <p className="text-lg font-semibold text-cyan-100">Driver</p>
          <p className="mt-1 text-sm text-cyan-200/80">
            Accept nearby passenger requests or publish your own route.
          </p>
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onPickRole("passenger")}
          className="group rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-left transition hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="mb-3">
            <PassengerIcon />
          </div>
          <p className="text-lg font-semibold text-emerald-100">Passenger</p>
          <p className="mt-1 text-sm text-emerald-200/80">
            Request rides, book listed trips, and pay through escrow.
          </p>
        </button>
      </div>
    </div>
  );
}
