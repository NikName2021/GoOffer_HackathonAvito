import { createMockProfileResponse } from '@/constants/createMockProfileResponse'
import type { CreateProfileRequest } from '@/types/profileRequest.type'
import type { GetProfilesResponse } from '@/types/profileResponse.type'

export const TEST_PROFILE_CREATE_REQUESTS: CreateProfileRequest[] = [
  {
    name: 'Анна Смирнова', joinedAt: '2018-04-14', avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg', likes: 148, chatsCount: 43,
    views: [
      {
        adId: 'anna-view-phone', title: 'Смартфон', category: 'Электроника', subcategory: 'Смартфоны', price: 118000, viewCount: 7,
        viewedAt: [
          { type: 'watch', time: '2026-03-08T12:20' },
          { type: 'like', time: '2026-03-10T18:20' },
          { type: 'watch', time: '2026-03-12T14:10' },
          { type: 'buy', time: '2026-03-12T14:10', useAvitoDelivery: true },
        ],
      },
    ],
    ownAds: [
      {
        adId: 'anna-own-tablet', title: 'Планшет', category: 'Электроника', subcategory: 'Планшеты', price: 28500, viewCount: 214,
        publishedAt: '2026-01-15', favoritesCount: 31, contactsCount: 12, city: 'Москва', isArchived: true, isSold: true,
        soldAt: '2026-02-20', review: { comment: 'Всё как в описании.', rating: 5, createdAt: '2026-02-21' },
      },
    ],
  },
  {
    name: 'Михаил Орлов', joinedAt: '2021-09-03', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', likes: 86, chatsCount: 51,
    views: [
      {
        adId: 'mikhail-view-guitar', title: 'Акустическая гитара', category: 'Хобби и отдых', price: 64900, viewCount: 11,
        viewedAt: [{ type: 'watch', time: '2026-05-20T17:15' }, { type: 'buy', time: '2026-05-21T19:20', useAvitoDelivery: false }],
      },
    ],
    ownAds: [
      {
        adId: 'mikhail-own-bike', title: 'Горный велосипед', category: 'Спорт', price: 46800, viewCount: 173,
        publishedAt: '2026-02-10', favoritesCount: 25, contactsCount: 9, city: 'Казань', isArchived: true, isSold: true, soldAt: '2026-04-11',
      },
    ],
  },
  {
    name: 'Елена Коваль', joinedAt: '2016-11-22', avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg', likes: 203, chatsCount: 27,
    views: [
      {
        adId: 'elena-view-vacuum', title: 'Робот-пылесос', category: 'Бытовая техника', price: 54990, viewCount: 9,
        viewedAt: [{ type: 'watch', time: '2026-04-01T10:15' }, { type: 'like', time: '2026-04-02T11:00' }, { type: 'buy', time: '2026-04-09T17:30', useAvitoDelivery: true }],
      },
    ],
    ownAds: [
      {
        adId: 'elena-own-coffee', title: 'Кофемашина', category: 'Бытовая техника', price: 19700, viewCount: 95,
        publishedAt: '2026-01-10', favoritesCount: 18, contactsCount: 7, city: 'Самара', isArchived: true, isSold: true, soldAt: '2026-03-14',
      },
    ],
  },
  {
    name: 'Даниил Волков', joinedAt: '2023-02-08', avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg', likes: 64, chatsCount: 36,
    views: [
      {
        adId: 'daniil-view-console', title: 'Игровая консоль', category: 'Электроника', price: 32000, viewCount: 6,
        viewedAt: [{ type: 'watch', time: '2026-03-29T12:30' }, { type: 'buy', time: '2026-03-30T19:40', useAvitoDelivery: false }],
      },
    ],
    ownAds: [
      {
        adId: 'daniil-own-monitor', title: 'Монитор', category: 'Электроника', price: 22500, viewCount: 82,
        publishedAt: '2026-05-01', favoritesCount: 14, contactsCount: 6, city: 'Москва', isArchived: false, isSold: false,
      },
    ],
  },
]

export const TEST_PROFILES: GetProfilesResponse = TEST_PROFILE_CREATE_REQUESTS.map((profile, index) =>
  createMockProfileResponse(profile, `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`),
)
