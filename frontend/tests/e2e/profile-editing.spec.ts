import { expect, test } from "@playwright/test";

import { mockApi } from "./mockApi";
import { profile } from "./mockData";

test("editing restores a missing hidden listing ID", async ({ page }) => {
  const legacyProfile = {
    ...profile,
    ownAds: profile.ownAds.map((ad) => ({ ...ad, adId: "" })),
  };
  await mockApi(page, { profileOverride: legacyProfile });
  await page.goto("/");

  const profileCard = page
    .getByRole("article")
    .filter({ hasText: profile.name });
  await profileCard.locator("header button").first().click();

  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" &&
      request.url().includes(`/api/profiles/${profile.id}`),
  );
  await page.locator('form button[type="submit"]').click();

  const body = (await updateRequest).postDataJSON() as {
    ownAds: Array<{ adId: string }>;
  };
  expect(body.ownAds[0].adId).toMatch(/^own-/);
});
