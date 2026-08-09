import { expect, test } from "@playwright/test";

import { mockApi } from "./mockApi";

test("sidebar opens the current account profiles", async ({ page }) => {
  await mockApi(page);
  await page.goto("/documentation");

  await page.getByRole("link", { name: "Мои профили" }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Чьи итоги посмотрим?" }),
  ).toBeVisible();
});

test("desktop sidebar can be collapsed and expanded", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop control");
  await mockApi(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Свернуть меню" }).click();
  await expect(
    page.getByRole("button", { name: "Развернуть меню" }),
  ).toBeVisible();
});
