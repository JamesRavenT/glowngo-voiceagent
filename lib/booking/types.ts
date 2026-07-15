export interface Booking {
  readonly reference: string;
  readonly branchId: string;
  readonly serviceId: string;
  readonly stylistId: string;
  readonly date: string;
  readonly time: string;
  readonly customerName: string;
  readonly customerPhone: string;
}

export interface Slot {
  readonly date: string;
  readonly time: string;
  readonly stylistId: string;
}

export interface AvailabilityQuery {
  readonly branchId: string;
  readonly serviceId: string;
  readonly date: string;
  readonly stylistId?: string;
}

export type CheckAvailabilityRequest = AvailabilityQuery;
export interface CheckAvailabilityResponse { readonly slots: readonly Slot[] }

export interface CreateBookingRequest extends AvailabilityQuery {
  readonly time: string;
  readonly customerName: string;
  readonly customerPhone: string;
}
export type CreateBookingResponse = Booking;

export interface RescheduleBookingRequest {
  readonly reference: string;
  readonly date: string;
  readonly time: string;
}
export type RescheduleBookingResponse = Booking;

export interface CancelBookingRequest { readonly reference: string }
export interface CancelBookingResponse { readonly reference: string; readonly cancelled: true }

export interface ErrorResponse { readonly error: string }
