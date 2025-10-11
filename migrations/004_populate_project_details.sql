-- projects 데이터 업데이트
UPDATE public.projects
SET 
  cover_image_url = 
    CASE id
      WHEN '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc' THEN 'https://cdn.example.com/seoul_city_hall.jpg'
      WHEN '5e61d416-6079-411a-ba71-8fdcf93ae8b5' THEN 'https://cdn.example.com/busan_library.jpg'
      WHEN '5620299f-3964-4c39-b8cc-98a1d18ff2f6' THEN 'https://cdn.example.com/national_medical_center.jpg'
    END,
  description = 
    CASE id
      WHEN '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc' THEN '서울시청 민원실의 노후된 공간을 전면 리모델링하여 시민들에게 더 나은 행정 서비스를 제공하는 쾌적하고 효율적인 공간으로 재탄생시켰습니다.'
      WHEN '5e61d416-6079-411a-ba71-8fdcf93ae8b5' THEN '부산을 대표하는 새로운 복합 문화 공간으로, 단순한 도서관을 넘어 시민들을 위한 지식과 문화의 허브 역할을 하도록 설계되었습니다.'
      WHEN '5620299f-3964-4c39-b8cc-98a1d18ff2f6' THEN '국립중앙의료원의 핵심 진료 공간을 현대적인 의료 환경 기준에 맞게 리노베이션하여 환자 중심의 안전하고 선진적인 의료 서비스를 제공합니다.'
    END,
  year = 
    CASE id
      WHEN '2cd55b40-4b09-4cc3-b5b9-dea6f2109dfc' THEN 2022
      WHEN '5e61d416-6079-411a-ba71-8fdcf93ae8b5' THEN 2023
      WHEN '5620299f-3964-4c39-b8cc-98a1d18ff2f6' THEN 2021
    END,
  area = 
    CASE id
      WHEN '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc' THEN 120.5
      WHEN '5e61d416-6079-411a-ba71-8fdcf93ae8b5' THEN 3400.0
      WHEN '5620299f-3964-4c39-b8cc-98a1d18ff2f6' THEN 850.75
    END
WHERE id IN ('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', '5e61d416-6079-411a-ba71-8fdcf93ae8b5', '5620299f-3964-4c39-b8cc-98a1d18ff2f6');









