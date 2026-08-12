DELETE FROM recap_missions older
USING recap_missions newer
WHERE older.user_id = newer.user_id
  AND older.recap_year = newer.recap_year
  AND (
      older.selected_at < newer.selected_at
      OR (older.selected_at = newer.selected_at AND older.id::text < newer.id::text)
  );

ALTER TABLE recap_missions
    DROP CONSTRAINT recap_missions_user_year_code_key;

ALTER TABLE recap_missions
    ADD CONSTRAINT recap_missions_user_id_recap_year_key
    UNIQUE (user_id, recap_year);
