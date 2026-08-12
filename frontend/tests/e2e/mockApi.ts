import type { Page, Route } from "@playwright/test";

import { missionOverview, profile, profileId, recap } from "./mockData";

const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
};

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    headers: corsHeaders,
    status,
  });
}

interface MockApiOptions {
  isAdmin?: boolean;
  profileOverride?: typeof profile;
}

export async function mockApi(
  page: Page,
  { isAdmin = false, profileOverride }: MockApiOptions = {},
) {
  const definitions: Record<string, unknown>[] = [];
  const achievements: Record<string, unknown>[] = [
    {
      category: "views",
      condition_operator: "gte",
      condition_value: 500,
      description: "Просмотрел не менее 500 объявлений за год",
      icon: "👀",
      is_active: true,
      metric: "total_views",
      slug: "curious",
      sort_order: 10,
      title: "Любопытный",
      updated_at: "2026-08-12T00:00:00Z",
    },
  ];
  const selectedProfile = profileOverride ?? profile;
  await page.route("http://localhost:8000/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (request.method() === "OPTIONS") {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }
    if (pathname === "/api/auth/me")
      return json(route, {
        createdAt: "2026-01-01T00:00:00Z",
        id: "account-1",
        isAdmin,
        login: "tester",
      });
    if (pathname === "/api/admin/card-definitions/options") {
      return json(route, {
        analyses: ["total", "monthly_average", "monthly_max"],
        conditions: ["always", "gt", "gte", "lt", "lte", "eq"],
        kinds: ["statistic", "highlight"],
        layouts: ["statistic", "hero"],
        metrics: ["total_views", "favorites", "purchases", "sales", "deals"],
        monthly_metrics: ["total_views", "favorites", "purchases", "sales"],
      });
    }
    if (pathname === "/api/admin/achievement-definitions/options") {
      return json(route, {
        conditions: ["always", "gt", "gte", "lt", "lte", "eq"],
        metrics: [
          "total_views",
          "favorites",
          "purchases",
          "sales",
          "listing_views",
          "contacts",
          "reviews",
          "activity_days",
          "categories",
          "deals",
        ],
      });
    }
    if (pathname === "/api/admin/achievement-definitions") {
      return json(route, { items: achievements });
    }
    if (pathname.startsWith("/api/admin/achievement-definitions/")) {
      const slug = decodeURIComponent(pathname.split("/").at(-1) ?? "");
      const index = achievements.findIndex((achievement) => achievement.slug === slug);
      if (index < 0) return json(route, { error: { message: "Not found" } }, 404);
      const updated = { ...achievements[index], ...request.postDataJSON() };
      achievements[index] = updated;
      return json(route, updated);
    }
    if (pathname === "/api/admin/card-definitions") {
      if (request.method() === "GET")
        return json(route, { items: definitions });
      const body = request.postDataJSON() as Record<string, unknown>;
      const created = {
        ...body,
        created_at: "2026-08-09T00:00:00Z",
        created_by: "account-1",
        id: "definition-1",
        updated_at: "2026-08-09T00:00:00Z",
      };
      definitions.push(created);
      return json(route, created, 201);
    }
    if (pathname.startsWith("/api/admin/card-definitions/")) {
      const id = pathname.split("/").at(-1);
      const index = definitions.findIndex((definition) => definition.id === id);
      if (request.method() === "DELETE") {
        definitions.splice(index, 1);
        return route.fulfill({ headers: corsHeaders, status: 204 });
      }
      const updated = { ...definitions[index], ...request.postDataJSON(), id };
      definitions[index] = updated;
      return json(route, updated);
    }
    if (pathname === "/api/profiles") return json(route, [selectedProfile]);
    if (pathname === `/api/profiles/${profileId}`)
      return json(route, selectedProfile);
    if (pathname === "/api/recap/generate") return json(route, recap, 201);
    if (pathname === `/api/recap/${profileId}/2026/mission`) {
      if (request.method() === "GET") return json(route, missionOverview);
      const { code } = request.postDataJSON() as { code: string };
      const option = missionOverview.options.find((item) => item.code === code);
      return json(route, {
        ...missionOverview,
        selected: option && {
          ...option,
          completed_at: null,
          progress: 0,
          progress_percent: 0,
          selected_at: "2026-08-08T00:00:00Z",
          status: "active",
          updated_at: "2026-08-08T00:00:00Z",
        },
      });
    }
    if (pathname === "/api/recap/events") {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }

    await json(
      route,
      { error: { code: "not_found", message: "Not found" } },
      404,
    );
  });
}
