import { branches } from "@/content/branches";
import { services } from "@/content/services";
import { stylists } from "@/content/stylists";
import type { DayOfWeek } from "@/content/types";
import type { AvailabilityQuery, Booking, Slot } from "@/lib/booking/types";

const DAYS: readonly DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class BookingValidationError extends Error {}

export function minutesFromTime(time: string): number | null {
  const match = TIME_PATTERN.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function timeFromMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

export function weekdayForDate(date: string): DayOfWeek | null {
  if (!DATE_PATTERN.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return DAYS[parsed.getUTCDay()];
}

export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function validateAvailabilityQuery(query: AvailabilityQuery) {
  const branch = branches.find((item) => item.id === query.branchId);
  if (!branch) throw new BookingValidationError("Unknown branchId");
  const service = services.find((item) => item.id === query.serviceId);
  if (!service) throw new BookingValidationError("Unknown serviceId");
  const weekday = weekdayForDate(query.date);
  if (!weekday) throw new BookingValidationError("date must be a valid YYYY-MM-DD date");
  const branchStylists = stylists.filter((item) => item.branchId === branch.id);
  if (query.stylistId) {
    const stylist = stylists.find((item) => item.id === query.stylistId);
    if (!stylist) throw new BookingValidationError("Unknown stylistId");
    if (stylist.branchId !== branch.id) throw new BookingValidationError("Stylist does not work at this branch");
    return { branch, service, weekday, eligibleStylists: [stylist] };
  }
  return { branch, service, weekday, eligibleStylists: branchStylists };
}

export function getAvailableSlots(query: AvailabilityQuery, bookings: readonly Booking[]): Slot[] {
  const { branch, service, weekday, eligibleStylists } = validateAvailabilityQuery(query);
  const hours = branch.hours[weekday];
  if ("closed" in hours) return [];
  const opening = minutesFromTime(hours.open)!;
  const closing = minutesFromTime(hours.close)!;
  const slots: Slot[] = [];
  for (let start = opening; start + service.durationMinutes <= closing; start += 15) {
    const stylist = eligibleStylists.find((candidate) => !bookings.some((booking) => {
      if (booking.stylistId !== candidate.id || booking.date !== query.date) return false;
      const bookedService = services.find((item) => item.id === booking.serviceId);
      const bookedStart = minutesFromTime(booking.time);
      return Boolean(bookedService && bookedStart !== null && intervalsOverlap(start, start + service.durationMinutes, bookedStart, bookedStart + bookedService.durationMinutes));
    }));
    if (stylist) slots.push({ date: query.date, time: timeFromMinutes(start), stylistId: stylist.id });
  }
  return slots;
}

export function findAvailableSlot(query: AvailabilityQuery, time: string, bookings: readonly Booking[]): Slot | null {
  const requestedMinutes = minutesFromTime(time);
  if (requestedMinutes === null || requestedMinutes % 15 !== 0) throw new BookingValidationError("time must be HH:mm on the 15-minute slot grid");
  return getAvailableSlots(query, bookings).find((slot) => slot.time === time) ?? null;
}
