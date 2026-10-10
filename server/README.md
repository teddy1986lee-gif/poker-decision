# GTO AI 코치 활성화

프런트엔드와 API 서버 코드는 준비되어 있습니다. 현재 `src/coach-config.js`의 endpoint가 비어 있어 사이트는 **AI 연결 준비 중**으로 표시하며 가짜 AI 답변을 생성하지 않습니다.

## 배포

1. Node.js 22 이상을 지원하는 서버에 이 저장소를 배포합니다. 실행 명령은 `node server/coach.cjs`입니다. HTTPS 주소를 연결합니다. 기존 GitHub Pages는 그대로 유지합니다.
2. 호스팅의 비공개 환경 변수에 `OPENAI_API_KEY`(발급한 API 키), `OPENAI_MODEL`(해당 계정에서 사용할 모델 ID)을 설정합니다. 키를 HTML·GitHub 저장소·브라우저에 넣지 않습니다.
3. `ALLOWED_ORIGINS=https://teddy1986lee-gif.github.io`를 설정합니다. 경로(`/poker-decision`)는 넣지 않습니다. 다른 프런트엔드를 허용하려면 쉼표로 origin을 추가합니다.
4. `src/coach-config.js`의 endpoint를 `https://실제서버주소/api/coach`로 바꿉니다. 공개 API 주소만 들어가며 키는 포함하지 않습니다.
5. `python3 build.py` 실행 후 소스와 `docs/index.html`을 함께 커밋합니다. GitHub Pages 반영 후 사이트에서 실제 질문과 후속 질문을 확인합니다.

## 동작과 운영 범위

- OpenAI Responses API 호출, 최근 최대 11개 메시지, 서버 45초 타임아웃, 출력 최대 2,200토큰, `store:false`.
- 학습용 GTO 원칙 설명입니다. 솔버와 레인지 데이터베이스는 연결되어 있지 않으므로 정확한 GTO 빈도/EV를 제공하지 않습니다. 질문과 최근 대화가 OpenAI로 전달됩니다. 서버는 질문/답변/키를 로그로 남기지 않습니다.
- 현재 탭 메모리에서 최대 20개 메시지를 유지하며 새로고침/새 대화 시 초기화됩니다. 실패하면 입력을 복원합니다. 한국어 입력 중 Enter는 전송하지 않으며 Ctrl/Command+Enter로 보낼 수 있습니다.
- 문제 풀이 후 버튼에서 카드, 보드, 포지션, 스택, 팟, 액션을 가져옵니다. 기존 문제의 정답은 AI에 사실로 주입하지 않습니다.
- 서버 프로세스 하나 기준 IP당 분당 6회, 동시 8회, UTC 하루 기본 500회 제한입니다. `DAILY_REQUEST_LIMIT`으로 변경합니다. 재시작 시 초기화되므로 고정 비용 상한은 아닙니다. 여러 인스턴스로 확장하려면 공유 저장소 기반 제한으로 교체해야 합니다.
- CORS는 사용자 인증이 아닙니다. 현재 공개 학습 서비스용이며 실제 과금 전 API 프로젝트 사용 한도와 호스팅 접근 제한을 설정합니다. `TRUST_PROXY=1`은 호스팅 프록시가 전달 헤더를 신뢰할 수 있게 관리할 때만 설정합니다. 기본 0은 모든 사용자가 프록시 IP 한도를 공유할 수 있습니다.
- 실제 키·모델·서버가 없는 상태에서는 유료 AI 호출 검증을 할 수 없습니다.

## 검증

`node --test tests/coach.test.cjs` — 가짜 응답을 사용하는 서버 통합 테스트(외부 API 과금 없음).

API 형식: https://developers.openai.com/api/docs/guides/text
