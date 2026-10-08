# 온기 · 겨울 찻집

새로 교체된 색연필 배경을 사용하는 React + TypeScript + Vite 첫 시제품입니다.
기존 프로젝트와 적용할 AGENTS.md는 없었습니다. 로그인, DB, 타이머 등은 포함하지 않습니다.

## 실행

```sh
npm install
npm run dev
```

터미널에 표시되는 주소(기본 `http://localhost:5173`)로 접속하세요.
같은 Wi-Fi의 iPad에서는 터미널의 Network 주소로 접속할 수 있습니다.

```sh
npm run build
npm run preview
```

## 이미지와 효과

- 배경: `assets/winter-house.png`. 파일을 교체하면 됩니다. 파일명을 바꾸면 `src/scene.ts`의 import도 바꾸세요.
- 원본은 1672 × 941입니다. 그림 전체를 유지하는 contain 방식으로 표시합니다. 화면 비율이 다르면 갈색 여백이 생기며, 이미지와 효과는 같은 좌표계를 사용합니다.
- 새 그림의 구도나 크기가 달라지면 `src/scene.ts`의 `width`, `height`, `cup`, `fire`, `panes`, `foreground`도 조정하세요. 좌표 단위는 원본 이미지의 픽셀입니다.
- `panes`는 창틀 안쪽의 네 유리 영역, `foreground`는 눈이 덮으면 안 되는 실내 조명·식물·작은 집·가지의 보수적인 제외 영역입니다. 가지 주변은 여유 있게 눈을 제외했습니다.
- 원본에 이미 고정된 김과 눈이 있습니다. 애니메이션은 그 위에 옅게 추가했으므로, 정지된 김·눈과 움직이는 효과가 함께 보입니다. 가장 자연스러운 결과를 원하면 같은 구도에서 김과 공중의 눈만 제거한 그림으로 교체하세요. 움직임 줄이기는 추가 효과만 멈추며 원본 그림의 김·눈은 남습니다.
- 속도: `src/scene.ts`의 `steamSeconds`(10초), `snowSeconds`(12초), `fireSeconds`(3초). 값을 늘리면 느려집니다. 눈은 입자별로 0~12초의 차이를 추가합니다.
- 김의 선명도는 `src/style.css`의 `steam-rise` 불투명도와 SVG의 선 두께로 조절합니다. 벽난로는 주변 빛(`fire-breathe`)과 유리 안쪽 빛(`fire-flicker`)을 별도로 조절합니다. 안쪽 빛은 `src/scene.ts`의 `fireOpening` 영역으로 제한됩니다.
- 효과의 밝기·이동량은 `src/style.css`의 keyframes와 `src/main.tsx`의 SVG에서 조절합니다.

## 소리와 접근성

- 음원은 제공되지 않습니다. 사용 권한이 있는 파일을 `public/audio/fireplace.mp3`에 넣으세요. 외부 음원은 가져오지 않습니다.
- 다른 파일은 `src/scene.ts`의 `audio` 경로를 변경해 연결하세요. `public/` 아래 파일은 URL에 `public/`을 붙이지 않습니다.
- 소리 켜기를 눌러야 재생합니다. 반복 재생, 켜기·끄기, 0~100% 볼륨을 지원합니다. 재생 실패 시 안내만 표시하고 화면은 유지합니다.
- 모든 주요 조작의 터치 영역은 44px 이상입니다. 키보드와 스크린리더로도 조작할 수 있습니다.
- 움직임 줄이기를 켜면 추가 눈과 김을 숨기고 벽난로 빛을 고정합니다. 기기의 `prefers-reduced-motion` 설정이 켜져 있으면 자동으로 적용되며 화면에서 해제할 수 없습니다.

## 검증

검증 결과는 `verification/RESULTS.md`에 기록합니다. 실제 iPad Safari와 실제 환경음의 최종 확인은 기기 및 사용 권한이 있는 음원으로 진행하세요.
