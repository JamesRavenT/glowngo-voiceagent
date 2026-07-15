import { findAvailableSlot } from "@/lib/booking/availability";
import { normalizeReferenceCode } from "@/lib/booking/reference-code";
import { errorResponse, readJsonObject, requireString } from "@/lib/booking/request";
import { getBooking, listBookings, replaceBooking } from "@/lib/booking/store";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const rawReference = requireString(body, "reference");
    const reference = normalizeReferenceCode(rawReference);
    if (!reference) return Response.json({ error: "Invalid booking reference" }, { status: 400 });
    const booking = getBooking(reference);
    if (!booking) return Response.json({ error: "Booking reference not found" }, { status: 404 });
    const date = requireString(body, "date");
    const time = requireString(body, "time");
    const otherBookings = listBookings().filter((item) => item.reference !== reference);
    const slot = findAvailableSlot({ branchId: booking.branchId, serviceId: booking.serviceId, stylistId: booking.stylistId, date }, time, otherBookings);
    if (!slot) return Response.json({ error: "Requested slot is not available" }, { status: 400 });
    return Response.json(replaceBooking({ ...booking, date, time }));
  } catch (error) { return errorResponse(error); }
}
