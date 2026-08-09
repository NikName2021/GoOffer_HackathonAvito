INSERT INTO users (id, name, avatar, registered_at, profile_type) VALUES
    ('11111111-1111-4111-8111-111111111111', 'Анна Смирнова', 'https://randomuser.me/api/portraits/women/44.jpg', '2018-04-14T00:00:00Z', 'mixed'),
    ('22222222-2222-4222-8222-222222222222', 'Михаил Орлов', 'https://randomuser.me/api/portraits/men/32.jpg', '2021-09-03T00:00:00Z', 'seller'),
    ('33333333-3333-4333-8333-333333333333', 'Елена Коваль', 'https://randomuser.me/api/portraits/women/68.jpg', '2016-11-28T00:00:00Z', 'buyer'),
    ('44444444-4444-4444-8444-444444444444', 'Даниил Волков', 'https://randomuser.me/api/portraits/men/75.jpg', '2023-02-19T00:00:00Z', 'mixed')
ON CONFLICT (id) DO NOTHING;
