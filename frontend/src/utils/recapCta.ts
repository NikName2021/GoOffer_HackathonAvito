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
      return withProfile(`${PATHS.AVITO_ORIGINAL}/search`, profileId, {
        category: cta.params?.category?.trim() || "",
      });
    case "open_listing":
      return adId
        ? withProfile(
            `${PATHS.AVITO_ORIGINAL}/items/${encodeURIComponent(adId)}`,
            profileId,
          )
        : withProfile(`${PATHS.AVITO_ORIGINAL}/recommendations`, profileId);
    case "open_own_listing":
      return adId
        ? withProfile(
            `${PATHS.AVITO_ORIGINAL}/my/items/${encodeURIComponent(adId)}`,
            profileId,
          )
        : withProfile(`${PATHS.AVITO_ORIGINAL}/my/items`, profileId);
    case "open_own_listings":
      return withProfile(`${PATHS.AVITO_ORIGINAL}/my/items`, profileId);
    case "open_favorites":
      return withProfile(`${PATHS.AVITO_ORIGINAL}/favorites`, profileId);
    case "open_chats":
      return withProfile(`${PATHS.AVITO_ORIGINAL}/messages`, profileId);
    case "create_listing":
      return withProfile(`${PATHS.AVITO_ORIGINAL}/create`, profileId);
    case "open_recommendations":
      return withProfile(`${PATHS.AVITO_ORIGINAL}/recommendations`, profileId);
    default:
      return withProfile(PATHS.AVITO_ORIGINAL, profileId);
  }
}
