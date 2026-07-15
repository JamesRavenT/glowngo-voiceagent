import { findAvailableSlot } from "@/lib/booking/availability";
import { errorResponse, optionalString, readJsonObject, requireString } from "@/lib/booking/request";
import { listBookings, saveBooking } from "@/lib/booking/store";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const query = { branchId: requireString(body, "branchId"), serviceId: requireString(body, "serviceId"), date: requireString(body, "date"), stylistId: optionalString(body, "stylistId") };
    const time = requireString(body, "time");
    const slot = findAvailableSlot(query, time, listBookings());
    if (!slot) return Response.json({ error: "Requested slot is not available" }, { status: 400 });
    const booking = saveBooking({ ...query, stylistId: slot.stylistId, time, customerName: requireString(body, "customerName"), customerPhone: requireString(body, "customerPhone") });
    return Response.json(booking, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
