import {
  ensureActivityIds,
  normalizeProfileForm,
} from "@/components/profileCards/createProfile/activityId";
import type { CreateProfileRequest } from "@/types/profileRequest.type";

function profileWithInvalidIds(): CreateProfileRequest {
  return {
    chatsCount: 0,
    joinedAt: "2020-01-01T00:00:00Z",
    likes: 0,
    name: "Test",
    ownAds: [
      {
        adId: "",
        category: "Transport",
        contactsCount: 0,
        favoritesCount: 0,
        isArchived: false,
        isSold: false,
        price: 100,
        publishedAt: "2026-01-01T00:00:00Z",
        title: "Bike",
        viewCount: 1,
      },
    ],
    views: [
      {
        adId: "",
        category: "Transport",
        price: 100,
        title: "Bike",
        viewCount: 1,
        viewedAt: [{ time: "2026-01-02T00:00:00Z", type: "watch" }],
      },
    ],
  };
}

test("creates unique hidden IDs for legacy profile activity", () => {
  const normalized = ensureActivityIds(profileWithInvalidIds());
  const ids = [
    ...normalized.ownAds.map((ad) => ad.adId),
    ...normalized.views.map((view) => view.adId),
  ];

  expect(ids.every(Boolean)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids[0]).toMatch(/^own-/);
  expect(ids[1]).toMatch(/^view-/);
});

test("normalizes form dates and restores a missing publication date", () => {
  const profile = profileWithInvalidIds();
  profile.ownAds[0] = { ...profile.ownAds[0], publishedAt: "" };
  const normalized = normalizeProfileForm(profile);

  expect(normalized.joinedAt).toBe("2020-01-01");
  expect(normalized.ownAds[0].publishedAt).toBe("2020-01-01");
  expect(normalized.views[0].viewedAt[0].time).toBe("2026-01-02T00:00");
});
