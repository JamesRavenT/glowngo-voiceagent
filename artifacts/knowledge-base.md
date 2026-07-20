# Glow & Go salon knowledge base

Glow & Go is a fictional Los Angeles salon portfolio demonstration built by James Raven Tabag. All appointments and customer details are synthetic demo data.

## Voice receptionist

The Glow & Go voice receptionist is Gigi, and her pronouns are she/her. She should introduce herself as Gigi at the start of a live call.

## Booking guidance

Callers may request a stylist by name or ask for any stylist/first available. Appointments use 15-minute start times and must finish before the branch closes. Every branch is closed on Mondays. Color Correction requires a consultation before it can be booked. To cancel or reschedule, the caller must provide the booking reference code in the format `GG-` followed by four digits, for example `GG-4821`; a name alone is never enough. Please request at least 24 hours' notice for cancellations or changes. The salon is appointment-only, although same-day openings may be available.

## Booking tool IDs

These are the exact ID values required by the booking tools. Use them verbatim, and never invent or derive an ID from a label.

### Services

| Service | `serviceId` | Duration |
| --- | --- | --- |
| Bang Trim | `bang-trim` | 15 min |
| Deep Conditioning Treatment | `deep-conditioning` | 30 min |
| Precision Cut | `precision-cut` | 45 min |
| Blowout & Style | `blowout` | 45 min |
| Gloss & Toner | `gloss-toner` | 45 min |
| Bridal Styling | `bridal-styling` | 1 hr 30 min |
| Partial Highlights | `partial-highlights` | 1 hr 45 min |
| Single Process Color | `single-process` | 2 hr |
| Full Highlights | `full-highlights` | 2 hr 30 min |
| Keratin Smoothing | `keratin` | 2 hr 30 min |
| Balayage | `balayage` | 3 hr |
| Color Correction | `color-correction` | 4 hr |

### Branches

| Branch | `branchId` |
| --- | --- |
| Silver Lake | `silver-lake` |
| Santa Monica | `santa-monica` |
| Pasadena | `pasadena` |
| Arts District | `arts-district` |

### Stylists by branch

#### Silver Lake

| Stylist | `stylistId` |
| --- | --- |
| Nova | `nova` |
| Dmitri | `dmitri` |
| Paloma | `paloma` |

#### Santa Monica

| Stylist | `stylistId` |
| --- | --- |
| Theo | `theo` |
| Ingrid | `ingrid` |
| Marcus | `marcus` |

#### Pasadena

| Stylist | `stylistId` |
| --- | --- |
| Yuki | `yuki` |
| Rosalind | `rosalind` |
| Cormac | `cormac` |

#### Arts District

| Stylist | `stylistId` |
| --- | --- |
| Zaid | `zaid` |
| Beatrix | `beatrix` |
| Juniper | `juniper` |

## Services

### Cuts & Styling

#### Bang Trim
Freshen your fringe and restore its shape between full cuts. Allow 15 min; the price is $25.

#### Precision Cut
Get a tailored cut shaped for your hair, features, and daily routine. Allow 45 min; the price is $95.

#### Blowout & Style
Leave with smooth, polished hair styled for your day or occasion. Allow 45 min; the price is $75.

#### Bridal Styling
Enjoy a polished, lasting wedding style designed around your look. Allow 1 hr 30 min; the price is $220.

### Treatments

#### Deep Conditioning Treatment
Restore softness, shine, and moisture with an intensive conditioning treatment. Allow 30 min; the price is $60.

#### Keratin Smoothing
Reduce frizz and make daily styling smoother and more manageable. Allow 2 hr 30 min; the price is $320.

### Color Services

#### Gloss & Toner
Refresh your tone and add luminous shine without a full color service. Allow 45 min; the price is $85.

#### Partial Highlights
Add brightness and dimension around the face and through the crown. Allow 1 hr 45 min; the price is $195.

#### Single Process Color
Create rich, even color from roots to ends in one dimensional shade. Allow 2 hr; the price is $180.

#### Full Highlights
Build brightness and dimension throughout your entire head of hair. Allow 2 hr 30 min; the price is $265.

#### Balayage
Create soft, hand-painted brightness with a natural, blended grow-out. Allow 3 hr; the price is $295.

#### Color Correction
Work toward your desired color with a personalized corrective plan. Allow 4 hr; the price is $450. A consultation is required before this service can be booked.

## Branches and stylists

All branches use the America/Los_Angeles time zone.

### Silver Lake
Visit 2140 Verbena Street, Los Angeles, CA 90026, or call (213) 555-0140. Hours are Monday: closed; Tuesday: 09:00–19:00; Wednesday: 09:00–19:00; Thursday: 09:00–19:00; Friday: 09:00–19:00; Saturday: 09:00–19:00; Sunday: 10:00–17:00. The Silver Lake team is Nova, specializing in balayage and lived-in color; Dmitri, specializing in precision cutting; Paloma, specializing in curly hair.

### Santa Monica
Visit 815 Marisol Court, Santa Monica, CA 90401, or call (310) 555-0172. Hours are Monday: closed; Tuesday: 09:00–19:00; Wednesday: 09:00–19:00; Thursday: 09:00–19:00; Friday: 09:00–19:00; Saturday: 09:00–19:00; Sunday: 10:00–17:00. The Santa Monica team is Theo, specializing in blondes and highlights; Ingrid, specializing in keratin and smoothing; Marcus, specializing in short cuts and fades.

### Pasadena
Visit 47 Ashgrove Lane, Pasadena, CA 91101, or call (626) 555-0119. Hours are Monday: closed; Tuesday: 09:00–19:00; Wednesday: 09:00–19:00; Thursday: 09:00–19:00; Friday: 09:00–19:00; Saturday: 09:00–19:00; Sunday: 10:00–17:00. The Pasadena team is Yuki, specializing in color correction; Rosalind, specializing in bridal and updos; Cormac, specializing in men's grooming.

### Arts District
Visit 1200 Ember Row, Los Angeles, CA 90013, or call (213) 555-0188. Hours are Monday: closed; Tuesday: 09:00–19:00; Wednesday: 09:00–19:00; Thursday: 09:00–19:00; Friday: 09:00–19:00; Saturday: 09:00–19:00; Sunday: 10:00–17:00. The Arts District team is Zaid, specializing in vivid color and fashion color; Beatrix, specializing in extensions; Juniper, specializing in blowouts and styling.

## Frequently asked questions

### How do I book an appointment?
Talk with Gigi. She checks live availability and books the time that works for you.

### Is this a real salon?
No. Glow & Go is a demonstration built by James Raven Tabag. Every booking is synthetic, and no one is expecting you.

### Can I request a specific stylist?
Yes. Ask for a stylist by name, or ask for the first available stylist.

### How do I cancel or reschedule?
Tell Gigi your booking reference code. That code is required to change or cancel an appointment.

### What is the cancellation policy?
Please give at least 24 hours' notice if you need to cancel or reschedule.

### How long will my appointment take?
Services run from 15 minutes to 4 hours. Gigi will confirm the duration when you book.

### Do you take walk-ins?
We are appointment only. Ask Gigi about same-day openings.

### Do I need a consultation for color correction?
Yes. A consultation is required before you can book color correction.

### Where can I see my booking?
You can view it on the public sheet, which carries synthetic demo data only.
