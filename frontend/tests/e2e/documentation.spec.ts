import { expect, test } from "@playwright/test";

import { mockApi } from "./mockApi";

test("documentation describes the project and demo access", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");

  await page.getByRole("link", { name: "Документация" }).click();

  await expect(page).toHaveURL("/documentation");
  await expect(
    page.getByRole("heading", { name: "Документация проекта" }),
  ).toBeVisible();
  await expect(page.getByText("nikita", { exact: true })).toBeVisible();
  await expect(page.getByText("avito2026", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Поля конструктора ачивок" }),
  ).toBeVisible();
  await expect(
    page.getByText("Пороговое значение", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Все сделки", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Открыть аналитику Grafana/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Go backend: логи и память" }),
  ).toBeVisible();
});
