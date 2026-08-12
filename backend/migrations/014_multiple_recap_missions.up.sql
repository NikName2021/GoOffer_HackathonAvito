ALTER TABLE recap_missions
    DROP CONSTRAINT recap_missions_user_id_recap_year_key;

ALTER TABLE recap_missions
    ADD CONSTRAINT recap_missions_user_year_code_key
    UNIQUE (user_id, recap_year, code);
