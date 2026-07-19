import type { Prisma } from "@prisma/client";

import type { ServiceDto, SpecialistDto } from "@/lib/types";

export const specialistInclude = {
  services: { select: { serviceId: true } },
} satisfies Prisma.SpecialistInclude;

type SpecialistWithServices = Prisma.SpecialistGetPayload<{
  include: typeof specialistInclude;
}>;

export function toServiceDto(service: {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  icon: string;
  featured: boolean;
  active: boolean;
}): ServiceDto {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    duration: service.duration,
    price: service.price,
    category: service.category,
    icon: service.icon,
    featured: service.featured,
    active: service.active,
  };
}

export function toSpecialistDto(specialist: SpecialistWithServices): SpecialistDto {
  return {
    id: specialist.id,
    name: specialist.name,
    slug: specialist.slug,
    title: specialist.title,
    bio: specialist.bio,
    experience: specialist.experience,
    rating: specialist.rating,
    color: specialist.color,
    initials: specialist.initials,
    active: specialist.active,
    serviceIds: specialist.services.map(({ serviceId }) => serviceId),
  };
}

export function createSlug(value: string, fallbackPrefix: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || `${fallbackPrefix}-${Date.now().toString(36)}`;
}

export function createInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
