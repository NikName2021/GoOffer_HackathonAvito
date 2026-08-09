-- Recap is generated exclusively from the item-level viewed_ads and own_ads
-- profile payloads. Remove the obsolete event source from existing databases.
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS categories;
