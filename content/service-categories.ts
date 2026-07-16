export const serviceCategories = [
  "Cuts & Styling",
  "Treatments",
  "Color Services",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
