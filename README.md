# mytoday · 오늘의 파편

하루 동안 떠오른 단어, 문장, 사진을 수시로 남기고, 하루 끝에 일기·에세이로 정리한 뒤 영어로 쓰고 말해보는 앱.

Next.js 16 · Supabase (Auth, Postgres, Storage) · shadcn/ui · Tailwind CSS · Leaflet/OpenStreetMap · Vercel

## 기능

- **그날의 파편**: 텍스트/사진 메모 (Enter로 바로 저장, 위치 자동 기록 on/off)
  - 워드 클라우드 / 타임라인 / 지도 보기 전환
  - 한글 파편은 자동으로 영어 번역 저장, 흐리게 표시되고 누르면 보임
- **하루 정리**: 제목 + 일기·에세이, 영어 버전 작성(참고 번역은 흐리게), 영어 말하기(음성 인식으로 기록, TTS로 듣기). 자동 저장.

## 설정

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql` 실행
2. Supabase → Authentication → URL Configuration 에 사이트 URL 추가 (`http://localhost:3000`, Vercel 도메인)
3. `.env.example` 을 `.env.local` 로 복사해서 값 채우기
4. `npm install && npm run dev`

### 번역

- `DEEPL_API_KEY` 가 있으면 **DeepL API Free** 사용 (월 50만 자 무료, 한→영 품질 좋음, 추천)
- 없으면 **MyMemory** 무료 API로 대체 (키 불필요, 하루 약 5,000자)

### 배포 (Vercel)

GitHub 저장소를 Vercel에 연결하고 위 환경 변수 3개를 Project Settings → Environment Variables 에 추가.
