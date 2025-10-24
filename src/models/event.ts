export interface Event {
  id: number;
  name: string;
  total_seats: number;
  created_at: Date;
}

export interface EventWithBookings extends Event {
  booked_seats: number;
  available_seats: number;
}