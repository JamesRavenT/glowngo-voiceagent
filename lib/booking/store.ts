// This module-level store is a reference implementation only. It is not durable across
// Cloudflare Workers isolates; live bookings are persisted in Google Sheets through n8n.
import { generateReferenceCode, normalizeReferenceCode } from "@/lib/booking/reference-code";
import type { Booking } from "@/lib/booking/types";

const seedBookings: readonly Booking[] = [
  {
    reference: "GG-4821", branchId: "silver-lake", serviceId: "balayage", stylistId: "nova",
    date: "2026-07-16", time: "13:30", customerName: "Sample Guest", customerPhone: "555-0100",
  },
  {
    reference: "GG-1057", branchId: "silver-lake", serviceId: "precision-cut", stylistId: "dmitri",
    date: "2026-07-16", time: "10:15", customerName: "Demo Visitor", customerPhone: "555-0101",
  },
  {
    reference: "GG-6304", branchId: "santa-monica", serviceId: "full-highlights", stylistId: "theo",
    date: "2026-07-16", time: "09:30", customerName: "Example Client", customerPhone: "555-0102",
  },
  {
    reference: "GG-2948", branchId: "pasadena", serviceId: "bridal-styling", stylistId: "rosalind",
    date: "2026-07-17", time: "15:00", customerName: "Sample Bride", customerPhone: "555-0103",
  },
];

const bookings = new Map<string, Booking>();

export function resetBookingStore(seed: readonly Booking[] = seedBookings): void {
  bookings.clear();
  for (const booking of seed) bookings.set(booking.reference, booking);
}

resetBookingStore();

export function listBookings(): Booking[] { return [...bookings.values()]; }

export function getBooking(reference: string): Booking | undefined {
  const normalized = normalizeReferenceCode(reference);
  return normalized ? bookings.get(normalized) : undefined;
}

export function saveBooking(booking: Omit<Booking, "reference">): Booking {
  const reference = generateReferenceCode(new Set(bookings.keys()));
  const saved = { ...booking, reference };
  bookings.set(reference, saved);
  return saved;
}

export function replaceBooking(booking: Booking): Booking {
  bookings.set(booking.reference, booking);
  return booking;
}

export function deleteBooking(reference: string): boolean {
  const normalized = normalizeReferenceCode(reference);
  return normalized ? bookings.delete(normalized) : false;
}
