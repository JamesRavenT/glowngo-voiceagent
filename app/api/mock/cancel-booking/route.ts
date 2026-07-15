import { normalizeReferenceCode } from "@/lib/booking/reference-code";
import { errorResponse, readJsonObject, requireString } from "@/lib/booking/request";
import { deleteBooking, getBooking } from "@/lib/booking/store";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const rawReference = requireString(body, "reference");
    const reference = normalizeReferenceCode(rawReference);
    if (!reference) return Response.json({ error: "Invalid booking reference" }, { status: 400 });
    if (!getBooking(reference)) return Response.json({ error: "Booking reference not found" }, { status: 404 });
    deleteBooking(reference);
    return Response.json({ reference, cancelled: true });
  } catch (error) { return errorResponse(error); }
}
