import { PATHS } from "@/config/paths";
import type { RecapCardCTA } from "@/types/recap.type";

function withProfile(
  path: string,
  profileId: string,
  params?: Record<string, string>,
) {
  const search = new URLSearchParams(params);
  search.set("profileId", profileId);
  return `${path}?${search.toString()}`;
}

export function getRecapCtaUrl(cta: RecapCardCTA, profileId: string) {
  const adId = cta.params?.ad_id?.trim();

  switch (cta.action) {
    case "open_category":
      return withProfile(`${PATHS.AVITO}/search`, profileId, {
        category: cta.params?.category?.trim() || "",
      });
    case "open_listing":
      return adId
        ? withProfile(
            `${PATHS.AVITO}/items/${encodeURIComponent(adId)}`,
            profileId,
          )
        : withProfile(`${PATHS.AVITO}/recommendations`, profileId);
    case "open_own_listing":
      return adId
        ? withProfile(
            `${PATHS.AVITO}/my/items/${encodeURIComponent(adId)}`,
            profileId,
          )
        : withProfile(`${PATHS.AVITO}/my/items`, profileId);
    case "open_own_listings":
      return withProfile(`${PATHS.AVITO}/my/items`, profileId);
    case "open_favorites":
      return withProfile(`${PATHS.AVITO}/favorites`, profileId);
    case "open_chats":
      return withProfile(`${PATHS.AVITO}/messages`, profileId);
    case "create_listing":
      return withProfile(`${PATHS.AVITO}/create`, profileId);
    case "open_recommendations":
      return withProfile(`${PATHS.AVITO}/recommendations`, profileId);
    default:
      return withProfile(PATHS.AVITO, profileId);
  }
}
