import { BookingValidationError, getAvailableSlots } from "@/lib/booking/availability";
import { errorResponse, optionalString, readJsonObject, requireString } from "@/lib/booking/request";
import { listBookings } from "@/lib/booking/store";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const query = { branchId: requireString(body, "branchId"), serviceId: requireString(body, "serviceId"), date: requireString(body, "date"), stylistId: optionalString(body, "stylistId") };
    return Response.json({ slots: getAvailableSlots(query, listBookings()) });
  } catch (error) {
    if (error instanceof BookingValidationError || error instanceof Error) return errorResponse(error);
    return errorResponse(error);
  }
}
