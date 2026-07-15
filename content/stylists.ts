import type { Stylist } from "./types";

export const stylists = [
  { id: "nova", name: "Nova", branchId: "silver-lake", specialties: ["balayage", "lived-in color"] },
  { id: "dmitri", name: "Dmitri", branchId: "silver-lake", specialties: ["precision cutting"] },
  { id: "paloma", name: "Paloma", branchId: "silver-lake", specialties: ["curly hair"] },
  { id: "theo", name: "Theo", branchId: "santa-monica", specialties: ["blondes", "highlights"] },
  { id: "ingrid", name: "Ingrid", branchId: "santa-monica", specialties: ["keratin", "smoothing"] },
  { id: "marcus", name: "Marcus", branchId: "santa-monica", specialties: ["short cuts", "fades"] },
  { id: "yuki", name: "Yuki", branchId: "pasadena", specialties: ["color correction"] },
  { id: "rosalind", name: "Rosalind", branchId: "pasadena", specialties: ["bridal", "updos"] },
  { id: "cormac", name: "Cormac", branchId: "pasadena", specialties: ["men's grooming"] },
  { id: "zaid", name: "Zaid", branchId: "arts-district", specialties: ["vivid color", "fashion color"] },
  { id: "beatrix", name: "Beatrix", branchId: "arts-district", specialties: ["extensions"] },
  { id: "juniper", name: "Juniper", branchId: "arts-district", specialties: ["blowouts", "styling"] },
] as const satisfies readonly Stylist[];
