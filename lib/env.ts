export type PublicEnv = {
  readonly bookingSheetUrl?: string;
};

export const publicEnv: PublicEnv = {
  bookingSheetUrl: process.env.NEXT_PUBLIC_BOOKING_SHEET_URL || undefined,
};
