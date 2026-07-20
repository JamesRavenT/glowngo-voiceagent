import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { voiceAgent } from "@/content/agent";
import { branches } from "@/content/branches";
import { faq } from "@/content/faq";
import { serviceCategories } from "@/content/service-categories";
import { services } from "@/content/services";
import { stylists } from "@/content/stylists";
import { formatDuration, formatPrice } from "@/lib/format";

function formatHours(): string {
  const hours = branches[0].hours;
  const days = Object.entries(hours).map(([day, value]) => {
    const label = `${day[0].toUpperCase()}${day.slice(1)}`;
    return "closed" in value ? `${label}: closed` : `${label}: ${value.open}–${value.close}`;
  });
  return days.join("; ");
}

export function generateKnowledgeBase(): string {
  const serviceIdRows = services
    .map((service) => `| ${service.name} | \`${service.id}\` | ${formatDuration(service.durationMinutes)} |`)
    .join("\n");

  const branchIdRows = branches
    .map((branch) => `| ${branch.name} | \`${branch.id}\` |`)
    .join("\n");

  const stylistIdTables = branches.map((branch) => {
    const rows = stylists
      .filter((stylist) => stylist.branchId === branch.id)
      .map((stylist) => `| ${stylist.name} | \`${stylist.id}\` |`)
      .join("\n");
    return `#### ${branch.name}\n\n| Stylist | \`stylistId\` |\n| --- | --- |\n${rows}`;
  }).join("\n\n");

  const serviceProse = serviceCategories.map((category) => {
    const categoryServices = services.filter((service) => service.category === category)
      .map((service) =>
        `#### ${service.name}\n${service.description} Allow ${formatDuration(service.durationMinutes)}; the price is ${formatPrice(service.priceCents)}.${"requiresConsultation" in service && service.requiresConsultation ? " A consultation is required before this service can be booked." : ""}`,
      ).join("\n\n");

    return `### ${category}\n\n${categoryServices}`;
  }).join("\n\n");

  const branchProse = branches.map((branch) => {
    const team = stylists.filter((stylist) => stylist.branchId === branch.id)
      .map((stylist) => `${stylist.name}, specializing in ${stylist.specialties.join(" and ")}`)
      .join("; ");
    return `### ${branch.name}\nVisit ${branch.address}, or call ${branch.phone}. Hours are ${formatHours()}. The ${branch.name} team is ${team}.`;
  }).join("\n\n");

  const faqProse = faq.map((item) => `### ${item.question}\n${item.answer}`).join("\n\n");

  return `# Glow & Go salon knowledge base\n\nGlow & Go is a fictional Los Angeles salon portfolio demonstration built by James Raven Tabag. All appointments and customer details are synthetic demo data.\n\n## Voice receptionist\n\nThe Glow & Go voice receptionist is ${voiceAgent.name}, and her pronouns are ${voiceAgent.pronouns}. She should introduce herself as ${voiceAgent.name} at the start of a live call.\n\n## Booking guidance\n\nCallers may request a stylist by name or ask for any stylist/first available. Appointments use 15-minute start times and must finish before the branch closes. Every branch is closed on Mondays. Color Correction requires a consultation before it can be booked. To cancel or reschedule, the caller must provide the booking reference code in the format \`GG-\` followed by four digits, for example \`GG-4821\`; a name alone is never enough. Please request at least 24 hours' notice for cancellations or changes. The salon is appointment-only, although same-day openings may be available.\n\n## Booking tool IDs\n\nThese are the exact ID values required by the booking tools. Use them verbatim, and never invent or derive an ID from a label.\n\n### Services\n\n| Service | \`serviceId\` | Duration |\n| --- | --- | --- |\n${serviceIdRows}\n\n### Branches\n\n| Branch | \`branchId\` |\n| --- | --- |\n${branchIdRows}\n\n### Stylists by branch\n\n${stylistIdTables}\n\n## Services\n\n${serviceProse}\n\n## Branches and stylists\n\nAll branches use the America/Los_Angeles time zone.\n\n${branchProse}\n\n## Frequently asked questions\n\n${faqProse}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(new URL("../artifacts/knowledge-base.md", import.meta.url), generateKnowledgeBase(), "utf8");
}
