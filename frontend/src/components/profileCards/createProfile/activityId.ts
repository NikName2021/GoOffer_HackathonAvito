import type { CreateProfileRequest } from "@/types/profileRequest.type";

export function createActivityId(prefix: "own" | "view") {
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${id}`;
}

export function ensureActivityIds(
  profile: CreateProfileRequest,
): CreateProfileRequest {
  const usedIds = new Set<string>();

  function uniqueId(value: unknown, prefix: "own" | "view") {
    const current = typeof value === "string" ? value.trim() : "";
    if (current && !usedIds.has(current)) {
      usedIds.add(current);
      return current;
    }

    let generated = createActivityId(prefix);
    while (usedIds.has(generated)) generated = createActivityId(prefix);
    usedIds.add(generated);
    return generated;
  }

  return {
    ...profile,
    ownAds: profile.ownAds.map((ad) => ({
      ...ad,
      adId: uniqueId(ad.adId, "own"),
    })),
    views: profile.views.map((view) => ({
      ...view,
      adId: uniqueId(view.adId, "view"),
    })),
  };
}
