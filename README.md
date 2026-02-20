# Campus Ride - Algorand Escrow Ridesharing

## Project Title And Description
Campus Ride is a mobile-first campus ride-sharing web app built with Next.js, Supabase Realtime, and Algorand.  
It connects passengers and drivers in real time, locks payments in Algorand escrow, and releases funds automatically when rides are completed.

## Problem Statement / Original Idea
Students need a safer and more transparent intra-campus ride coordination system than ad-hoc messaging groups.  
This project solves that by combining:
- realtime matching (Supabase),
- wallet-based identity + trust (Pera Wallet),
- programmable settlement guarantees (Algorand escrow).

## Live Demo URL
`<ADD_LIVE_DEMO_URL>`

## LinkedIn Demo Video URL
`<ADD_LINKEDIN_DEMO_VIDEO_URL>`

## App ID (Testnet) And Explorer Link
- Algorand Testnet App ID: `<ADD_APP_ID>`
- Testnet Explorer: `https://testnet.explorer.perawallet.app/application/<ADD_APP_ID>`

## Architecture Overview (Smart Contract + Frontend Interaction)
1. Passenger signs in, connects Pera Wallet, and books a ride (`status = waiting`).
2. Driver receives ride in realtime and accepts (`status = accepted`, `driver_id`, `driver_wallet` set).
3. Passenger wallet sends ALGO to escrow app address; ride escrow state becomes `locked`.
4. Passenger or driver taps `Complete Ride`.
5. Smart-contract release path triggers payout to assigned driver wallet and marks ride `completed`.
6. Ride becomes non-active; both users can start a new ride.

Data + coordination:
- Supabase Postgres (`ride_bookings`, `users`, `driver_vehicles`, `ratings`)
- Supabase Realtime subscriptions for ride lifecycle updates.

Trust + settlement:
- Algorand Testnet escrow app + Pera Wallet signatures.

## Tech Stack
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Backend/Data: Supabase (Auth, Postgres, Realtime, RLS)
- Blockchain: Algorand Testnet
- Wallet: Pera Wallet (`@perawallet/connect`)
- Smart Contract Tooling: AlgoKit + Python contract project in `ride-escrow/`
- Smart Contract Language: PyTeal/AlgoKit Python (see `ride-escrow/projects/ride-escrow/smart_contracts`)

## Installation And Setup Instructions
### 1. Clone
```bash
git clone <REPO_URL>
cd RIFT/Rift-noida
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>

NEXT_PUBLIC_RIDE_ESCROW_APP_ID=<ALGOD_TESTNET_APP_ID>
NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS=<ALGOD_TESTNET_APP_ADDRESS>

GOOGLE_MAPS_API_KEY=<OPTIONAL_FOR_PLACES>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<OPTIONAL_FOR_PLACES>
```

### 4. Apply database migrations
```bash
supabase db push
```

### 5. Run the app
```bash
npm run dev
```

### 6. Production build check
```bash
npm run build
```

## Usage Guide (With Screenshots)
1. Login as passenger, connect wallet, book a ride.
2. Login as driver on second laptop/session, connect wallet, accept ride.
3. Passenger sees accepted status and escrow lock confirmation.
4. Passenger/driver completes ride; payment releases.

Screenshots:
- Booking flow: `docs/screenshots/passenger-booking.png`
- Driver realtime accept: `docs/screenshots/driver-realtime.png`
- Escrow locked status: `docs/screenshots/escrow-locked.png`
- Completion + payment released: `docs/screenshots/ride-completed.png`

## Known Limitations
- Escrow release path in frontend is demo-safe and should be replaced with full ARC client call in production.
- Google Places requires API key; without key, location search is gracefully disabled.
- Current explorer/status text is UI-level; deeper on-chain event indexing is not yet implemented.
- Notification system is in-app toast only (no push/SMS).

## Team Members And Roles
- `<TEAM_MEMBER_1>` - Smart contract and AlgoKit integration
- `<TEAM_MEMBER_2>` - Frontend and realtime ride UX
- `<TEAM_MEMBER_3>` - Supabase schema, RLS, API routes
- `<TEAM_MEMBER_4>` - Product demo, testing, deployment
