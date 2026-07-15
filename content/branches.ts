import { SALON_TIMEZONE } from "./salon";
import type { Branch, WeeklyHours } from "./types";

const standardHours = {
  monday: { closed: true },
  tuesday: { open: "09:00", close: "19:00" },
  wednesday: { open: "09:00", close: "19:00" },
  thursday: { open: "09:00", close: "19:00" },
  friday: { open: "09:00", close: "19:00" },
  saturday: { open: "09:00", close: "19:00" },
  sunday: { open: "10:00", close: "17:00" },
} as const satisfies WeeklyHours;

export const branches = [
  { id: "silver-lake", name: "Silver Lake", address: "2140 Verbena Street, Los Angeles, CA 90026", phone: "(213) 555-0140", timezone: SALON_TIMEZONE, hours: standardHours },
  { id: "santa-monica", name: "Santa Monica", address: "815 Marisol Court, Santa Monica, CA 90401", phone: "(310) 555-0172", timezone: SALON_TIMEZONE, hours: standardHours },
  { id: "pasadena", name: "Pasadena", address: "47 Ashgrove Lane, Pasadena, CA 91101", phone: "(626) 555-0119", timezone: SALON_TIMEZONE, hours: standardHours },
  { id: "arts-district", name: "Arts District", address: "1200 Ember Row, Los Angeles, CA 90013", phone: "(213) 555-0188", timezone: SALON_TIMEZONE, hours: standardHours },
] as const satisfies readonly Branch[];
