import type {
  CreateOwnAdRequest,
  CreateProfileRequest,
} from "@/types/profileRequest.type";

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

function dateInputValue(value: unknown) {
  if (typeof value !== "string") return "";
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
}

function dateTimeInputValue(value: unknown) {
  if (typeof value !== "string") return "";
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(0, 16) : "";
}

export function normalizeProfileForm(
  profile: CreateProfileRequest,
): CreateProfileRequest {
  const normalized = ensureActivityIds(profile);
  const joinedAt = dateInputValue(normalized.joinedAt);

  return {
    ...normalized,
    joinedAt,
    ownAds: normalized.ownAds.map((ad): CreateOwnAdRequest => {
      const soldAt = ad.isSold ? dateInputValue(ad.soldAt) : "";
      const publishedAt = dateInputValue(ad.publishedAt) || soldAt || joinedAt;

      if (!ad.isSold) return { ...ad, publishedAt };
      return {
        ...ad,
        publishedAt,
        soldAt,
        review: ad.review
          ? { ...ad.review, createdAt: dateInputValue(ad.review.createdAt) }
          : undefined,
      };
    }),
    views: normalized.views.map((view) => ({
      ...view,
      viewedAt: view.viewedAt.map((event) => ({
        ...event,
        time: dateTimeInputValue(event.time),
      })),
    })),
  };
}
