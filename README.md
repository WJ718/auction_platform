# NodeAuction - 실시간 경매 플랫폼

Node.js 기반의 실시간 온라인 경매 웹 애플리케이션입니다.<br>  
사용자는 회원가입 후 상품을 등록하고, 다른 사용자들과 실시간으로 입찰 경쟁을 할 수 있으며<br>
입찰 시 채팅 기능을 지원합니다.

---
## ER 다이어그램
<img src="./images/ER.png"/><br>
- Users 테이블: 회원정보 저장 
- Goods 테이블 : 회원이 업로드한 상품 정보 저장 (상품 정보, 낙찰자, 등록자 포함)
- Auctions 테이블 : 입찰 기록 저장 (입찰가, 메시지 포함)
---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원가입 / 로그인 | 이메일, 닉네임, 비밀번호 기반 사용자 인증 (bcrypt + Passport) |
| 상품 등록 | 상품명, 이미지, 시작가 입력 → 등록된 상품은 24시간 동안 경매 가능 |
| 실시간 경매 | 실시간 입찰 기능 (Socket.IO 사용), 24시간 후 자동 낙찰 처리 |
| 낙찰 목록 조회 | 내가 낙찰받은 상품들을 별도 페이지에서 확인 가능 |
| 이미지 업로드 | Multer 기반 이미지 업로드 (5MB 제한) |
| 스케줄링 | Node-schedule로 24시간 경과 시 낙찰 자동 처리 |
| 인증 미들웨어 | 로그인 여부에 따라 접근 가능 페이지 구분 |

---

### 주요 코드

![send-message](./images/send-message.png)
- 경매 입찰 시 DB 저장과 동시에 Socket.IO를 사용
- 같은 상품 페이지에 접속한 사용자들(room: )에게 실시간으로 입찰 정보를 전송하도록 구현

![socket](./images/socket.png)
- 사용자가 접속한 상품 페이지 URL을 기준으로 room ID를 추출
- 해당 상품에 대한 입찰 이벤트만 수신하도록 설

![end-schedule](./images/end-schedule.png)
- 경매 등록 시점에 종료 시각을 계산하고, node-schedule을 이용해 경매 종료 시 자동으로 낙찰자를 선정하고 자산을 차감

![bcrypt](./images/bcrypt.png)
- 비밀번호는 bcrypt로 해시 처리하여 저장
- 로그인 시 해시 비교 방식으로 인증

![sse](./images/sse.png)
- 클라이언트 시간 오차 문제를 방지하기 위해 SSE로 서버 시간을 주기적으로 전달받아 경매 남은 시간을 계산
  
---

## 화면 예시
메인 페이지<br>
<img src="./images/main.png"/><br>
<br>
회원가입
<img src="./images/signup.png"/><br>
<br>
로그인 성공<br>
<img src="./images/login_success.png"/><br>
상품 등록<br>
<img src="./images/goods.png"/><br>
<br>
상품 목록<br>
<img src="./images/upload_goods.png"/><br>
<br>
경매방 입장<br>
<img src="./images/room.png"/><br>
<br>
