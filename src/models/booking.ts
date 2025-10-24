export interface Booking {
  id: number;
  event_id: number;
  user_id: string;
  created_at: Date;
}

export interface ReserveBookingRequest {
  event_id: number;
  user_id: string;
}

export interface ReserveBookingResponse {
  success: boolean;
  booking?: Booking;
  error?: string;
}