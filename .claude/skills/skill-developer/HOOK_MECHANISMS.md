# 훅 메커니즘 - 딥 다이브

UserPromptSubmit 및 PreToolUse 훅이 어떻게 동작하는지에 대한 기술적 딥 다이브 문서입니다.

## 목차

- [UserPromptSubmit 훅 플로우](#userpromptsubmit-hook-flow)
- [PreToolUse 훅 플로우](#pretooluse-hook-flow)
- [종료 코드 동작(중요)](#exit-code-behavior-critical)
- [세션 상태 관리](#session-state-management)
- [성능 고려사항](#performance-considerations)

---

## UserPromptSubmit 훅 플로우

### 실행 순서

```
User submits prompt
    ↓
.claude/settings.json registers hook
    ↓
skill-activation-prompt.sh executes
    ↓
npx tsx skill-activation-prompt.ts
    ↓
Hook reads stdin (JSON with prompt)
    ↓
Loads skill-rules.json
    ↓
Matches keywords + intent patterns
    ↓
Groups matches by priority (critical → high → medium → low)
    ↓
Outputs formatted message to stdout
    ↓
stdout becomes context for Claude (injected before prompt)
    ↓
Claude sees: [skill suggestion] + user's prompt
```

### 핵심 포인트

- **종료 코드(Exit code)**: 항상 0(허용)
- **stdout**: → Claude 컨텍스트(시스템 메시지로 주입)
- **타이밍**: Claude가 프롬프트를 처리하기 *이전*에 실행
- **동작**: 비차단, 안내(advisory) 전용
- **목적**: 관련 스킬을 Claude가 인지하도록 함

### 입력 포맷

```json
{
  "session_id": "abc-123",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/root/git/your-project",
  "permission_mode": "normal",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "how does the layout system work?"
}
```

### 출력 포맷(stdout)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RECOMMENDED SKILLS:
  → project-catalog-developer

ACTION: Use Skill tool BEFORE responding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Claude는 이 출력을 사용자 프롬프트 처리 전에 추가 컨텍스트로 받습니다.

---

## PreToolUse 훅 플로우

### 실행 순서

```
Claude calls Edit/Write tool
    ↓
.claude/settings.json registers hook (matcher: Edit|Write)
    ↓
skill-verification-guard.sh executes
    ↓
npx tsx skill-verification-guard.ts
    ↓
Hook reads stdin (JSON with tool_name, tool_input)
    ↓
Loads skill-rules.json
    ↓
Checks file path patterns (glob matching)
    ↓
Reads file for content patterns (if file exists)
    ↓
Checks session state (was skill already used?)
    ↓
Checks skip conditions (file markers, env vars)
    ↓
IF MATCHED AND NOT SKIPPED:
  Update session state (mark skill as enforced)
  Output block message to stderr
  Exit with code 2 (BLOCK)
ELSE:
  Exit with code 0 (ALLOW)
    ↓
IF BLOCKED:
  stderr → Claude sees message
  Edit/Write tool does NOT execute
  Claude must use skill and retry
IF ALLOWED:
  Tool executes normally
```

### 핵심 포인트

- **종료 코드 2**: 차단(BLOCK) (stderr → Claude)
- **종료 코드 0**: 허용(ALLOW)
- **타이밍**: 툴 실행 *이전*에 실행
- **세션 추적**: 같은 세션에서 반복 차단을 방지
- **Fail open**: 오류가 나면 작업을 허용(워크플로를 깨지 않음)
- **목적**: 핵심 가드레일을 강제

### 입력 포맷

```json
{
  "session_id": "abc-123",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/root/git/your-project",
  "permission_mode": "normal",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/root/git/your-project/form/src/services/user.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

### 출력 포맷(차단 시 stderr)

```
⚠️ BLOCKED - Database Operation Detected

📋 REQUIRED ACTION:
1. Use Skill tool: 'database-verification'
2. Verify ALL table and column names against schema
3. Check database structure with DESCRIBE commands
4. Then retry this edit

Reason: Prevent column name errors in Prisma queries
File: form/src/services/user.ts

💡 TIP: Add '// @skip-validation' comment to skip future checks
```

Claude는 이 메시지를 보고, 편집을 재시도하기 전에 스킬을 사용해야 한다고 이해합니다.

---

## 종료 코드 동작(중요)

### 종료 코드 레퍼런스 테이블

| Exit Code | stdout | stderr | 툴 실행 | Claude가 보는 것 |
|-----------|--------|--------|----------------|-------------|
| 0 (UserPromptSubmit) | → Context | → User only | N/A | stdout content |
| 0 (PreToolUse) | → User only | → User only | **Proceeds** | Nothing |
| 2 (PreToolUse) | → User only | → **CLAUDE** | **BLOCKED** | stderr content |
| Other | → User only | → User only | Blocked | Nothing |

### 종료 코드 2가 중요한 이유

이는 enforcement를 위한 가장 핵심 메커니즘입니다:

1. **Only way** to send message to Claude from PreToolUse
2. stderr content is "fed back to Claude automatically"
3. Claude sees the block message and understands what to do
4. Tool execution is prevented
5. Critical for enforcement of guardrails

### 대화 플로우 예시

```
User: "Add a new user service with Prisma"

Claude: "I'll create the user service..."
    [Attempts to Edit form/src/services/user.ts]

PreToolUse Hook: [Exit code 2]
    stderr: "⚠️ BLOCKED - Use database-verification"

Claude sees error, responds:
    "I need to verify the database schema first."
    [Uses Skill tool: database-verification]
    [Verifies column names]
    [Retries Edit - now allowed (session tracking)]
```

---

## 세션 상태 관리

### 목적

같은 세션에서 반복적으로 잔소리하듯 차단하지 않기 위해, Claude가 한 번 스킬을 사용하면 다시 차단하지 않도록 합니다.

### 상태 파일 위치

`.claude/hooks/state/skills-used-{session_id}.json`

### 상태 파일 구조

```json
{
  "skills_used": [
    "database-verification",
    "error-tracking"
  ],
  "files_verified": []
}
```

### 동작 방식

1. **First edit** of file with Prisma:
   - Hook blocks with exit code 2
   - Updates session state: adds "database-verification" to skills_used
   - Claude sees message, uses skill

2. **Second edit** (same session):
   - Hook checks session state
   - Finds "database-verification" in skills_used
   - Exits with code 0 (allow)
   - No message to Claude

3. **Different session**:
   - New session ID = new state file
   - Hook blocks again

### 한계

훅은 스킬이 *실제로* 실행되었는지 감지할 수 없습니다. 스킬당/세션당 한 번만 차단합니다. 즉:

- Claude가 스킬을 쓰지 않고 다른 편집을 해도 다시 차단하지 않을 수 있음
- Claude가 지시를 따를 것이라는 전제를 둠
- 향후 개선: 실제 Skill tool 사용을 감지

---

## 성능 고려사항

### 목표 지표

- **UserPromptSubmit**: < 100ms
- **PreToolUse**: < 200ms

### 성능 병목

1. **Loading skill-rules.json** (every execution)
   - Future: Cache in memory
   - Future: Watch for changes, reload only when needed

2. **Reading file content** (PreToolUse)
   - Only when contentPatterns configured
   - Only if file exists
   - Can be slow for large files

3. **Glob matching** (PreToolUse)
   - Regex compilation for each pattern
   - Future: Compile once, cache

4. **Regex matching** (Both hooks)
   - Intent patterns (UserPromptSubmit)
   - Content patterns (PreToolUse)
   - Future: Lazy compile, cache compiled regexes

### 최적화 전략

**패턴 수 줄이기:**
- Use more specific patterns (fewer to check)
- Combine similar patterns where possible

**파일 경로 패턴:**
- More specific = fewer files to check
- Example: `form/src/services/**` better than `form/**`

**콘텐츠 패턴:**
- Only add when truly necessary
- Simpler regex = faster matching

---

**관련 파일:**
- [SKILL.md](SKILL.md) - Main skill guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debug hook issues
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Configuration reference
