---
name: route-tester
description: 쿠키 기반 인증을 사용해 프로젝트의 인증된 라우트를 테스트합니다. API 엔드포인트 테스트, 변경 후 라우트 기능 검증, 인증 이슈 디버깅 시 이 스킬을 사용하세요. test-auth-route.js 사용 패턴과 mock 인증 패턴을 포함합니다.
---

# 프로젝트 라우트 테스터 스킬

## 목적
이 스킬은 쿠키 기반 JWT 인증을 사용해 프로젝트의 인증된 라우트를 테스트하는 패턴을 제공합니다.

## 이 스킬을 사용해야 하는 경우
- 새 API 엔드포인트를 테스트할 때
- 변경 후 라우트 기능을 검증할 때
- 인증 이슈를 디버깅할 때
- POST/PUT/DELETE 작업을 테스트할 때
- 요청/응답 데이터를 확인할 때

## 프로젝트 인증 개요

프로젝트는 다음을 사용합니다:
- SSO용 **Keycloak**(realm: yourRealm)
- **쿠키 기반 JWT** 토큰(Bearer 헤더가 아님)
- **쿠키 이름**: `refresh_token`
- **JWT 서명**: `config.ini`의 시크릿 사용

## 테스트 방법

### 방법 1: test-auth-route.js (권장)

`test-auth-route.js` 스크립트가 인증 관련 복잡도를 자동으로 처리합니다.

**Location**: `/root/git/your project_pre/scripts/test-auth-route.js`

#### Basic GET Request

```bash
node scripts/test-auth-route.js http://localhost:3000/blog-api/api/endpoint
```

#### POST Request with JSON Data

```bash
node scripts/test-auth-route.js \
    http://localhost:3000/blog-api/777/submit \
    POST \
    '{"responses":{"4577":"13295"},"submissionID":5,"stepInstanceId":"11"}'
```

#### What the Script Does

1. Gets a refresh token from Keycloak
   - Username: `testuser`
   - Password: `testpassword`
2. Signs the token with JWT secret from `config.ini`
3. Creates cookie header: `refresh_token=<signed-token>`
4. Makes the authenticated request
5. Shows the exact curl command to reproduce manually

#### Script Output

스크립트 출력:
- 요청 상세
- 응답 상태와 본문
- 수동 재현을 위한 curl 명령어

**참고**: 스크립트 출력이 장황합니다. 출력에서 실제 응답 부분을 찾아보세요.

### 방법 2: 토큰을 사용한 수동 curl

test-auth-route.js 출력에 나온 curl 명령어를 사용하세요:

```bash
# 스크립트 출력은 대략 아래와 같습니다:
# 💡 curl로 수동 테스트:
# curl -b "refresh_token=eyJhbGci..." http://localhost:3000/blog-api/api/endpoint

# 해당 curl 명령어를 복사해서 수정:
curl -X POST http://localhost:3000/blog-api/777/submit \
  -H "Content-Type: application/json" \
  -b "refresh_token=<COPY_TOKEN_FROM_SCRIPT_OUTPUT>" \
  -d '{"your": "data"}'
```

### 방법 3: mock 인증(개발 전용 - 가장 쉬움)

개발 환경에서는 mock 인증으로 Keycloak을 완전히 우회할 수 있습니다.

#### Setup

```bash
# 서비스의 .env 파일에 추가(예: blog-api/.env)
MOCK_AUTH=true
MOCK_USER_ID=test-user
MOCK_USER_ROLES=admin,operations
```

#### Usage

```bash
curl -H "X-Mock-Auth: true" \
     -H "X-Mock-User: test-user" \
     -H "X-Mock-Roles: admin,operations" \
     http://localhost:3002/api/protected
```

#### Mock Auth Requirements

mock 인증은 다음 조건에서만 동작합니다:
- `NODE_ENV`가 `development` 또는 `test`
- 라우트에 `mockAuth` 미들웨어가 추가됨
- 프로덕션에서는 **절대** 동작하지 않음(보안 기능)

## 자주 쓰는 테스트 패턴

### 폼 제출 테스트

```bash
node scripts/test-auth-route.js \
    http://localhost:3000/blog-api/777/submit \
    POST \
    '{"responses":{"4577":"13295"},"submissionID":5,"stepInstanceId":"11"}'
```

### 워크플로 시작 테스트

```bash
node scripts/test-auth-route.js \
    http://localhost:3002/api/workflow/start \
    POST \
    '{"workflowCode":"DHS_CLOSEOUT","entityType":"Submission","entityID":123}'
```

### 워크플로 스텝 완료 테스트

```bash
node scripts/test-auth-route.js \
    http://localhost:3002/api/workflow/step/complete \
    POST \
    '{"stepInstanceID":789,"answers":{"decision":"approved","comments":"Looks good"}}'
```

### 쿼리 파라미터가 있는 GET 테스트

```bash
node scripts/test-auth-route.js \
    "http://localhost:3002/api/workflows?status=active&limit=10"
```

### 파일 업로드 테스트

```bash
# 먼저 test-auth-route.js로 토큰을 얻은 뒤:
curl -X POST http://localhost:5000/upload \
  -H "Content-Type: multipart/form-data" \
  -b "refresh_token=<TOKEN>" \
  -F "file=@/path/to/file.pdf" \
  -F "metadata={\"description\":\"Test file\"}"
```

## 하드코딩된 테스트 계정 정보

`test-auth-route.js` 스크립트는 다음 계정 정보를 사용합니다:

- **Username**: `testuser`
- **Password**: `testpassword`
- **Keycloak URL**: From `config.ini` (usually `http://localhost:8081`)
- **Realm**: `yourRealm`
- **Client ID**: From `config.ini`

## 서비스 포트

| Service | Port | Base URL |
|---------|------|----------|
| Users   | 3000 | http://localhost:3000 |
| Projects| 3001 | http://localhost:3001 |
| Form    | 3002 | http://localhost:3002 |
| Email   | 3003 | http://localhost:3003 |
| Uploads | 5000 | http://localhost:5000 |

## 라우트 프리픽스(접두사)

Check `/src/app.ts` in each service for route prefixes:

```typescript
// Example from blog-api/src/app.ts
app.use('/blog-api/api', formRoutes);          // Prefix: /blog-api/api
app.use('/api/workflow', workflowRoutes);  // Prefix: /api/workflow
```

**Full Route** = Base URL + Prefix + Route Path

Example:
- Base: `http://localhost:3002`
- Prefix: `/form`
- Route: `/777/submit`
- **Full URL**: `http://localhost:3000/blog-api/777/submit`

## 테스트 체크리스트

라우트를 테스트하기 전에:

- [ ] Identify the service (form, email, users, etc.)
- [ ] Find the correct port
- [ ] Check route prefixes in `app.ts`
- [ ] Construct the full URL
- [ ] Prepare request body (if POST/PUT)
- [ ] Determine authentication method
- [ ] Run the test
- [ ] Verify response status and data
- [ ] Check database changes if applicable

## DB 변경 확인

After testing routes that modify data:

```bash
# MySQL 접속
docker exec -i local-mysql mysql -u root -ppassword1 blog_dev

# 특정 테이블 확인
mysql> SELECT * FROM WorkflowInstance WHERE id = 123;
mysql> SELECT * FROM WorkflowStepInstance WHERE instanceId = 123;
mysql> SELECT * FROM WorkflowNotification WHERE recipientUserId = 'user-123';
```

## 실패한 테스트 디버깅

### 401 Unauthorized

**가능한 원인**:
1. Token expired (regenerate with test-auth-route.js)
2. Incorrect cookie format
3. JWT secret mismatch
4. Keycloak not running

**해결 방법**:
```bash
# Keycloak 실행 여부 확인
docker ps | grep keycloak

# 토큰 재생성
node scripts/test-auth-route.js http://localhost:3002/api/health

# config.ini의 jwtSecret이 올바른지 확인
```

### 403 Forbidden

**가능한 원인**:
1. User lacks required role
2. Resource permissions incorrect
3. Route requires specific permissions

**해결 방법**:
```bash
# admin 역할로 mock 인증 사용
curl -H "X-Mock-Auth: true" \
     -H "X-Mock-User: test-admin" \
     -H "X-Mock-Roles: admin" \
     http://localhost:3002/api/protected
```

### 404 Not Found

**가능한 원인**:
1. Incorrect URL
2. Missing route prefix
3. Route not registered

**해결 방법**:
1. Check `app.ts` for route prefixes
2. Verify route registration
3. Check service is running (`pm2 list`)

### 500 Internal Server Error

**가능한 원인**:
1. Database connection issue
2. Missing required fields
3. Validation error
4. Application error

**해결 방법**:
1. Check service logs (`pm2 logs <service>`)
2. Check Sentry for error details
3. Verify request body matches expected schema
4. Check database connectivity

## auth-route-tester 에이전트 사용

변경 후 라우트를 포괄적으로 테스트하려면:

1. **Identify affected routes**
2. **Gather route information**:
   - Full route path (with prefix)
   - Expected POST data
   - Tables to verify
3. **Invoke auth-route-tester agent**

에이전트는 다음을 수행합니다:
- Test the route with proper authentication
- Verify database changes
- Check response format
- Report any issues

## 테스트 시나리오 예시

### 새 라우트를 만든 후

```bash
# 1. Test with valid data
node scripts/test-auth-route.js \
    http://localhost:3002/api/my-new-route \
    POST \
    '{"field1":"value1","field2":"value2"}'

# 2. Verify database
docker exec -i local-mysql mysql -u root -ppassword1 blog_dev \
    -e "SELECT * FROM MyTable ORDER BY createdAt DESC LIMIT 1;"

# 3. Test with invalid data
node scripts/test-auth-route.js \
    http://localhost:3002/api/my-new-route \
    POST \
    '{"field1":"invalid"}'

# 4. Test without authentication
curl http://localhost:3002/api/my-new-route
# 401을 반환해야 함
```

### 라우트를 수정한 후

```bash
# 1. Test existing functionality still works
node scripts/test-auth-route.js \
    http://localhost:3002/api/existing-route \
    POST \
    '{"existing":"data"}'

# 2. Test new functionality
node scripts/test-auth-route.js \
    http://localhost:3002/api/existing-route \
    POST \
    '{"new":"field","existing":"data"}'

# 3. Verify backward compatibility
# 이전 요청 포맷으로 테스트(해당되는 경우)
```

## 설정 파일

### config.ini (서비스별)

```ini
[keycloak]
url = http://localhost:8081
realm = yourRealm
clientId = app-client

[jwt]
jwtSecret = your-jwt-secret-here
```

### .env (서비스별)

```bash
NODE_ENV=development
MOCK_AUTH=true           # Optional: Enable mock auth
MOCK_USER_ID=test-user   # Optional: Default mock user
MOCK_USER_ROLES=admin    # Optional: Default mock roles
```

## 핵심 파일

- `/root/git/your project_pre/scripts/test-auth-route.js` - Main testing script
- `/blog-api/src/app.ts` - Form service routes
- `/notifications/src/app.ts` - Email service routes
- `/auth/src/app.ts` - Users service routes
- `/config.ini` - Service configuration
- `/.env` - Environment variables

## 관련 스킬

- Use **database-verification** to verify database changes
- Use **error-tracking** to check for captured errors
- Use **workflow-builder** for workflow route testing
- Use **notification-sender** to verify notifications sent
