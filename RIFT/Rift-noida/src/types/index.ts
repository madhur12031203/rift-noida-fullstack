export type FareResult = {
  provider: "Uber" | "Ola" | "Rapido";
  price: number;
  duration: string;
  distance: string;
  icon: string;
  bookingUrl?: string;
};

export interface LocationInput {
  origin: string;
  destination: string;
}

export type UserRole = "driver" | "passenger";

export type BookingStatus = "pending" | "ongoing" | "completed" | "cancelled";

export type RideRow = {
  id: string;
  driver_id: string;
  source: string;
  destination: string;
  available_seats: number;
  status: string;
  departure_time?: string | null;
};

export type RideRequestRow = {
  id: string;
  passenger_id: string;
  source: string;
  destination: string;
  fare_estimate: number;
  status: string;
};

/** Core realtime ride booking (passenger-initiated, lat/lng) */
export type RideBookingRow = {
  id: string;
  passenger_id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  status: "waiting" | "accepted" | "completed";
  created_at: string;
};

export type BookingRow = {
  id: string;
  driver_id: string;
  passenger_id: string;
  ride_id: string | null;
  fare: number;
  status: BookingStatus;
  algorand_app_id: number | null;
  escrow_txn_id: string | null;
};

export type UserProfileRow = {
  id: string;
  name: string | null;
  role: UserRole | null;
  wallet_address: string | null;
  rating_avg: number | null;
  rating_count: number | null;
};

export type DocumentType = "college_id" | "aadhaar" | "driving_license";
export type VerificationStatus = "pending" | "verified" | "rejected";

export type UserVerificationRow = {
  id: string;
  user_id: string;
  document_type: DocumentType;
  document_url: string;
  status: VerificationStatus;
  created_at: string;
  reviewed_at: string | null;
};
