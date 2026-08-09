import marketplacePlaceholder from '@/assets/avito-demo/marketplace-placeholder.webp'

export interface AvitoProduct {
  image: string
  price: string
  title: string
}

export const AVITO_IMAGE_FALLBACK = marketplacePlaceholder

export const AVITO_CATEGORIES = [
  { label: 'Авто', image: 'https://www.avito.st/static/ims/0bf3d8ac-175d-4ffa-a1a0-32531cb0281d_desktop_common_612x300.png' },
  { label: 'Недвижимость', image: 'https://avito.st/static/ims/58ecdae2-646b-4cce-ae51-c13bd0832689_real_common_612x300.png' },
  { label: 'Жильё для путешествия', image: 'https://avito.st/static/ims/30153f16-e700-409b-91e8-69d2568b56ad_travel_common_612x300.png' },
  { label: 'Для дома и дачи', image: 'https://avito.st/static/ims/c9387619-d39b-4380-91a2-d02d39c21455_home_common_612x300.png' },
  { label: 'Запчасти', image: 'https://avito.st/static/ims/24a985bd-9d95-4d04-94f9-04541de4f787_zap_common_612x300.png' },
  { label: 'Услуги', image: 'https://avito.st/static/ims/3f494871-8e97-4090-adc9-dfff03a939a0_services_common_612x300.png' },
  { label: 'Электроника', image: 'https://avito.st/static/ims/e82283a9-3bde-42c7-8b5c-41d23ca13890_electronics_common_612x300.png' },
  { label: 'Работа и подработка', image: 'https://avito.st/static/ims/9f0f1107-e049-4b62-a4d4-aba5b41146a0_job_common_612x300.png' },
  { label: 'Бизнес 360', image: 'https://avito.st/static/ims/fcac5b0c-9799-447c-8d56-a307fc39240e_business_common_612x300.png' },
  { label: 'Одежда, обувь, аксессуары', image: 'https://avito.st/static/ims/093d322b-ad72-43b9-905d-6cb7da5baf45_clothes_common_612x300.png' },
] as const

export const AVITO_BUSINESS = [
  ['Оборудование', 'https://avito.st/static/ims/970d85c5-c915-4be2-8bb1-55f4e51bf2d0_jobs_equipment_common_112x112.png'],
  ['Помещения', 'https://avito.st/static/ims/62ad12c2-dd34-442b-ba3f-7e880078c53d_jobs_space_common_112x112.png'],
  ['Товары', 'https://avito.st/static/ims/f7fc86bd-1025-4eb8-9767-9acbd17d2645_jobs_goods_common_112x112.png'],
  ['Транспорт', 'https://avito.st/static/ims/662a8a95-cdb8-46ab-bba0-26183e130436_jobs_transport_common_112x112.png'],
  ['Услуги', 'https://avito.st/static/ims/bb029b08-4b46-4060-b323-696c51c0c035_jobs_services_common_112x112.png'],
  ['Сотрудники', 'https://avito.st/static/ims/b4a37d4c-9f11-4776-8acf-e12af5f8ee7d_jobs_worker_common_112x112.png'],
] as const

export const AVITO_PRODUCTS: AvitoProduct[] = [
  { title: 'Детские вещи пакетом в садик бу', price: '50 ₽', image: 'https://90.img.avito.st/image/1/1.raa_RLa1AU_h4utI6WLDmKjkA08B7-tI4eIDTQ.xpXq6HRMmA-67qtVaWP_B9z3gsEWhRP_bJ0gPW5GXco' },
  { title: 'Машинки для стрижки собак', price: '1 100 ₽', image: 'https://40.img.avito.st/image/1/1.l-ufSLa1OwLB7tEFvU7wl4voOQIh49EFwe45AA.BcJHCl7jZEQytWvSulnzraZWN8I5evJ3huHTZXwXI2o' },
  { title: 'Машинки для стрижки собак', price: '1 100 ₽', image: 'https://20.img.avito.st/image/1/1.xLfRdra1aF6P0IJZ1UWbxsXWal5v3YJZj9BqXA.KK6G39DGmq6leUB3Vnj4VySo7HV3Ol5L_Tx6vc2NPos' },
  { title: 'Монитор Arzopa A3c 16 Дюймов', price: '8 000 ₽', image: 'https://80.img.avito.st/image/1/1.x-Lp8La1awu3VoEM65uF3tZQaQtXW4EMt1ZpCQ.MIclju72vV6EI6Kq6QVnsWIagY357G2HbfJXlk4gzTQ' },
  { title: 'Ибп', price: '1 500 ₽', image: 'https://80.img.avito.st/image/1/1.p2mhSLa1C4D_7uGH4zLIEbXoCYAf4-GH_-4Jgg.ZOfevRsQ6m2g3q5AQgeTUEIjAcEHurx0M-3lCaMj0M8' },
  { title: 'Детская кроватка 120х60 приставная', price: 'Бесплатно', image: 'https://30.img.avito.st/image/1/1.dwEaura12-hEHDHveN8gcA4a2eikETHvRBzZ6g.Tf4MgT0R_K_06I3eT8RfnqZPNIP9uJQf5Vkp_YqD3VQ' },
  { title: 'Сплит-система Aero ARS-II-09', price: '18 500 ₽', image: 'https://00.img.avito.st/image/1/1.pYHpsLa1CWi3FuNvr8qog_8QC2hXG-NvtxYLag.poTrhI56r_zSg-6C-N3DA-wbWqrnD8tdUZJ8aBCqWGY' },
  { title: 'Книги Сары Джио', price: '200 ₽', image: 'https://50.img.avito.st/image/1/1.Y9_LiLa1zzaVLiUxgdFJ7twozTZ1IyUxlS7NNA.dAQhpN3TN8llaSPMscPAeScwmuCYaNSBAAymvab5kQ4' },
  { title: 'Пудра Stellary и Ewa mosaic', price: '362 ₽', image: 'https://50.img.avito.st/image/1/1.x2fTSLa1a46N7oGJ0VeRH8foaY5t44GJje5pjA.OBojYmIYr5E6iADZiByKa4lE4t1MjEVfB7nijfHWuAE' },
  { title: 'Дача 80 м² на участке 1 сот.', price: '7 000 000 ₽', image: 'https://40.img.avito.st/image/1/1.OjLUkra1ltuKNHzcrMpsT_0ylNtqOXzcijSU2Q.TzmhxEt7Xw5kqfQqoJEakzShPygAbfgpZzJId4Tq7m8' },
  { title: 'Попугай монах выкормыш', price: '25 000 ₽', image: 'https://70.img.avito.st/image/1/1.3BeP_7a1cP7RWZr5u9SCVqRfcv4xVJr50Vly_A.pGkkHxZzyj-sGx2eUnMtxKqIE9tzoSBRSLb5HV-CqmM' },
  { title: 'Yamaha MT-10, 2023, 3 960 км', price: '1 510 000 ₽', image: 'https://50.img.avito.st/image/1/1.zOI8-ba1YAtiX4oMKPa_4AZZYguCUooMYl9iCQ.wzkckmvG-vJgq9Jb947JaNNAH4sMDyCZoTFt2NwfLS0' },
  { title: 'Часы Swatch детские', price: '1 600 ₽', image: 'https://30.img.avito.st/image/1/1.FxJxp7a1u_svAVH8U4NjDmcHufvPDFH8LwG5-Q.eIcJw3IcVFLaB2SJP9kYsE9SD5GaFH1Mk70hJP032bk' },
  { title: 'Рефрижератор Ford Transit, 2020', price: '1 850 000 ₽ с НДС', image: 'https://70.img.avito.st/image/1/1.iPQxPLa1JB1vms4aLRKMtxicJh2Pl84ab5omHw.tC-fU8YkEwQfoBtOHkj-qYG1yQEktPQ-c0k2AJP4ZAM' },
  { title: 'Спальный гарнитур / Доставим за 1-5 дней', price: '31 400 ₽', image: 'https://90.img.avito.st/image/1/1.c2n6Pra134CkmDWHkHsHDO2e3YBElTWHpJjdgg.VPr_VCL0q10r6neCiJDikGsBQI5dntcbGAT3pNZ0Vjo' },
  { title: 'Какао Julius Meinl 1 кг', price: '1 350 ₽', image: 'https://80.img.avito.st/image/1/1._-8emba1UwZAP7kBbJ6Kmzc5UQagMrkBQD9RBA.LpznX80MGO-erRtbaQCRe2VCOkE8jCOPbvbCTD3XZsk' },
  { title: 'Диск Форсаж 1-4 части DVD', price: '750 ₽', image: 'https://60.img.avito.st/image/1/1.ouFn6ra1Dgg5TOQPL4jAjE9KDAjZQeQPOUwMCg.q4yh0v7Lr13TFyCqEMOy3rY0zl1UhVD6WwkVUaLs7kU' },
  { title: 'Toyota Land Cruiser Prado 2.7 AT, 2013', price: '3 300 000 ₽', image: 'https://60.img.avito.st/image/1/1.RaPhULaA6Uq_9gNN5yFRqMrw605T5-1KU4CITlMb7qBS8-1Qv_YDTVc.M1AyblNta3zqq0pm_IMCuJ3p_LNKbXdADezLDhj99fc' },
  { title: 'Дача 45 м² на участке 13 сот.', price: '6 199 000 ₽', image: 'https://80.img.avito.st/image/1/1.xoZ_r7a1am8hCYBof9zP5DQOaG_BBIBoIQlobQ.rCkOBxBZ0g0uMvL7k-wJQpwLO9xic3KHkevVq2_WbbE' },
  { title: 'Сансет Хил', price: 'Цена не указана', image: 'https://70.img.avito.st/image/1/1.ioMx3La1JmpvesxtKarZ2FV9JGqPd8xtb3okaA.NGyedoEaFf5JdMwhX5rLdymJegkbf3Pu1I_l981THiQ' },
  { title: 'Тренажер с жимом ногами Rebel G9LP', price: 'Цена не указана', image: 'https://00.img.avito.st/image/1/1.8SuRCba2XcLPr7fF_wrsC0uqXcgvQlooIqpf.ETLdTguVQ9bRNIY7ueyyx_2kLPjiD83BHG96GWubE4A' },
  { title: 'Русский черный терьер, щенок', price: '50 000 ₽', image: 'https://20.img.avito.st/image/1/1.4-zUQra1TwWK5KUCnkncy__iTQVq6aUCiuRNBw.bEbnLSPdhFF4dLdj1VIUBujPEK7uOScfA2lqYzgTiEs' },
  { title: 'Алтайский котёнок', price: '100 ₽', image: 'https://80.img.avito.st/image/1/1.7eIiBra1QQt8oKsMdFWv7w6mQwucrasMfKBDCQ.g3gA3r0XQC0IlHoICBK6C2-uve2vlkR4mck5c8FCktw' },
  { title: 'Продавец', price: '45 400 — 60 500 ₽', image: 'https://30.img.avito.st/image/1/1.23UEqra1d5xaDJ2bPs2-CBAKdZy6AZ2bWgx1ng.LCieJSWmrhJBd-4UjHyJ2saHQmSxdHe453ipj4iU0ic' },
  { title: 'Мацеста', price: 'Цена не указана', image: 'https://90.img.avito.st/image/1/1.ruk_nLa1AgBhOugHb7aA5RU8AACBN-gHYToAAg.NA_Rz2Dzx2acAZwHVkud2eu6a8mpJ1LOhZSVpJ-BWI4' },
  { title: 'Попугаи неразлучники', price: '6 000 ₽', image: 'https://60.img.avito.st/image/1/1.x8zTS7a1ayWN7YEi0VS9qcfraSVt4IEije1pJw.Hp2DgEcjd4cywgYHRaFXXTzeLGkbYhBF1LzL8RlVh28' },
  { title: 'Домашняя птица', price: '50 000 ₽', image: 'https://10.img.avito.st/image/1/1.wH4M6La1bJdSToaQAOfVSBtIbpeyQ4aQUk5ulQ.is80UXYaIUXI_CQpoFSqkz3yi6Ao4_FszexAjmuBbZE' },
  { title: 'Клетка', price: '6 000 ₽', image: 'https://00.img.avito.st/image/1/1.Bh7RU7a1qveP9UDw0UdebMXzqPdv-EDwj_Wo9Q.E_gQSCsOH_kEwfA_oOrrzfP_b4Chgbpss-yH3sqThsY' },
  { title: 'Молодые петухи', price: '500 ₽', image: 'https://70.img.avito.st/image/1/1.w07riLa1b6e1LoWg4ffNf_wobadVI4WgtS5tpQ.4Rx6pk_3AS6jZ451tEw98vdL-l_H_9MMJYeb-fKxtTc' },
  { title: 'Клетка', price: '6 000 ₽', image: 'https://00.img.avito.st/image/1/1.Bh7RU7a1qveP9UDw0UdebMXzqPdv-EDwj_Wo9Q.E_gQSCsOH_kEwfA_oOrrzfP_b4Chgbpss-yH3sqThsY' },
  { title: 'Диски DVD-RW Verbatim', price: '450 ₽', image: 'https://00.img.avito.st/image/1/1.L33asLa1g5SEFmmTiLwRRfEQgZRkG2mThBaBlg.0910UT0_m7CjVUm13gdRKCUuKa3FrFGwASB3sEcvGKs' },
  { title: 'Морская волна', price: 'Цена не указана', image: 'https://30.img.avito.st/image/1/1.e_a1Aba11x_rpz0YzxR006Kh1R8Lqj0Y66fVHQ.ohY2AfEOEKnXi1GzXKMQJrvF59dLDZCDlMvy_wtIV7k' },
  { title: 'Молодые петухи', price: '500 ₽', image: 'https://10.img.avito.st/image/1/1.nzlekLa1M9AANtnXbKLYCkkwMdDgO9nXADYx0g.zefmCEJ10pROVC25hl_2QQ7t27g3qXBFJFKpkMHBZgU' },
  { title: 'Коралл-Лоо', price: 'Цена не указана', image: 'https://60.img.avito.st/image/1/1._TVvfba1Udwx27vbGUbELCLcU9zR1rvbMdtT3g.zMNP0WdylcPNJcyYZ4I_wnhiOjhe2nCQPrf0MdAgHNc' },
]
