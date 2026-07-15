export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OpeningHours =
  | { readonly closed: true }
  | { readonly open: string; readonly close: string };

export type WeeklyHours = Readonly<Record<DayOfWeek, OpeningHours>>;

export interface Salon {
  readonly name: string;
  readonly tagline: string;
  readonly heroHeadlineLines: readonly string[];
  readonly timezone: string;
  readonly disclaimer: string;
}

export interface Branch {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly timezone: string;
  readonly hours: WeeklyHours;
}

export interface Stylist {
  readonly id: string;
  readonly name: string;
  readonly branchId: string;
  readonly specialties: readonly string[];
}

export interface Service {
  readonly id: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly priceCents: number;
  readonly description: string;
  readonly requiresConsultation?: boolean;
}

export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly defaultOpen?: boolean;
}
