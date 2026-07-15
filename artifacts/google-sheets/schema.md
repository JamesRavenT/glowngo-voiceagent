# Bookings sheet schema

Create a worksheet named `Bookings` with this exact header row. Every column is required so a row round-trips the `Booking` type in `lib/booking/types.ts` without transformation.

| Column | Sheet value/type | Meaning |
| --- | --- | --- |
| `reference` | Plain text | Unique normalized code matching `GG-0000` through `GG-9999`. |
| `branchId` | Plain text | A branch ID from `content/branches.ts`. |
| `serviceId` | Plain text | A service ID from `content/services.ts`. |
| `stylistId` | Plain text | A stylist ID from `content/stylists.ts`. |
| `date` | Plain text | Local appointment date in `YYYY-MM-DD` form. Format as plain text to prevent locale conversion. |
| `time` | Plain text | Local 24-hour start time in `HH:mm` form. Format as plain text to preserve leading zeroes. |
| `customerName` | Plain text | Synthetic caller name. |
| `customerPhone` | Plain text | Synthetic caller phone number; plain text preserves formatting and leading zeroes. |

Example row:

| reference | branchId | serviceId | stylistId | date | time | customerName | customerPhone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GG-4821 | silver-lake | balayage | nova | 2026-07-16 | 13:30 | Sample Guest | 555-0100 |

This sheet is publicly shared and must contain **synthetic data only**. The site warns callers not to provide real details and identifies all bookings as demo data.
