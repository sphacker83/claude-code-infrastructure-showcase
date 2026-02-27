# 트리거 유형 - 완전 가이드

Claude Code 스킬 자동 활성화 시스템에서 스킬 트리거를 설정하기 위한 완전 레퍼런스입니다.

## 목차

- [Keyword Triggers (Explicit)](#keyword-triggers-explicit)
- [Intent Pattern Triggers (Implicit)](#intent-pattern-triggers-implicit)
- [File Path Triggers](#file-path-triggers)
- [Content Pattern Triggers](#content-pattern-triggers)
- [Best Practices Summary](#best-practices-summary)

---

## 키워드 트리거(명시적)

### 동작 방식

사용자 프롬프트에서 대소문자 구분 없이 부분 문자열을 매칭합니다.

### 사용 목적

사용자가 주제를 명시적으로 언급하는 경우의 주제 기반 활성화에 사용합니다.

### 설정

```json
"promptTriggers": {
  "keywords": ["layout", "grid", "toolbar", "submission"]
}
```

### 예시

- User prompt: "how does the **layout** system work?"
- Matches: "layout" keyword
- Activates: `project-catalog-developer`

### 모범 사례

- Use specific, unambiguous terms
- Include common variations ("layout", "layout system", "grid layout")
- Avoid overly generic words ("system", "work", "create")
- Test with real prompts

---

## 의도 패턴 트리거(암묵적)

### 동작 방식

사용자가 주제를 명시적으로 언급하지 않아도, 정규식 패턴 매칭으로 의도를 감지합니다.

### 사용 목적

특정 주제보다 “무엇을 하고 싶은지”를 설명하는 경우의 액션 기반 활성화에 사용합니다.

### 설정

```json
"promptTriggers": {
  "intentPatterns": [
    "(create|add|implement).*?(feature|endpoint)",
    "(how does|explain).*?(layout|workflow)"
  ]
}
```

### 예시

**Database Work:**
- User prompt: "add user tracking feature"
- Matches: `(add).*?(feature)`
- Activates: `database-verification`, `error-tracking`

**Component Creation:**
- User prompt: "create a dashboard widget"
- Matches: `(create).*?(component)` (if component in pattern)
- Activates: `frontend-dev-guidelines`

### 모범 사례

- Capture common action verbs: `(create|add|modify|build|implement)`
- Include domain-specific nouns: `(feature|endpoint|component|workflow)`
- Use non-greedy matching: `.*?` instead of `.*`
- Test patterns thoroughly with regex tester (https://regex101.com/)
- Don't make patterns too broad (causes false positives)
- Don't make patterns too specific (causes false negatives)

### 자주 쓰는 패턴 예시

```regex
# Database Work
(add|create|implement).*?(user|login|auth|feature)

# Explanations
(how does|explain|what is|describe).*?

# Frontend Work
(create|add|make|build).*?(component|UI|page|modal|dialog)

# Error Handling
(fix|handle|catch|debug).*?(error|exception|bug)

# Workflow Operations
(create|add|modify).*?(workflow|step|branch|condition)
```

---

## 파일 경로 트리거

### 동작 방식

편집 중인 파일 경로에 대해 glob 패턴 매칭을 수행합니다.

### 사용 목적

프로젝트 내 파일 위치를 기반으로, 도메인/영역별 활성화에 사용합니다.

### 설정

```json
"fileTriggers": {
  "pathPatterns": [
    "frontend/src/**/*.tsx",
    "form/src/**/*.ts"
  ],
  "pathExclusions": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Glob 패턴 문법

- `**` = Any number of directories (including zero)
- `*` = Any characters within a directory name
- Examples:
  - `frontend/src/**/*.tsx` = All .tsx files in frontend/src and subdirs
  - `**/schema.prisma` = schema.prisma anywhere in project
  - `form/src/**/*.ts` = All .ts files in form/src subdirs

### 예시

- File being edited: `frontend/src/components/Dashboard.tsx`
- Matches: `frontend/src/**/*.tsx`
- Activates: `frontend-dev-guidelines`

### 모범 사례

- Be specific to avoid false positives
- Use exclusions for test files: `**/*.test.ts`
- Consider subdirectory structure
- Test patterns with actual file paths
- Use narrower patterns when possible: `form/src/services/**` not `form/**`

### 자주 쓰는 경로 패턴

```glob
# Frontend
frontend/src/**/*.tsx        # All React components
frontend/src/**/*.ts         # All TypeScript files
frontend/src/components/**   # Only components directory

# Backend Services
form/src/**/*.ts            # Form service
email/src/**/*.ts           # Email service
users/src/**/*.ts           # Users service

# Database
**/schema.prisma            # Prisma schema (anywhere)
**/migrations/**/*.sql      # Migration files
database/src/**/*.ts        # Database scripts

# Workflows
form/src/workflow/**/*.ts              # Workflow engine
form/src/workflow-definitions/**/*.json # Workflow definitions

# Test Exclusions
**/*.test.ts                # TypeScript tests
**/*.test.tsx               # React component tests
**/*.spec.ts                # Spec files
```

---

## 콘텐츠 패턴 트리거

### 동작 방식

파일의 실제 내용(파일 안의 코드)에 대해 정규식 패턴 매칭을 수행합니다.

### 사용 목적

코드가 import/사용하는 기술(Prisma, 컨트롤러, 특정 라이브러리 등)에 기반한 기술별 활성화에 사용합니다.

### 설정

```json
"fileTriggers": {
  "contentPatterns": [
    "import.*[Pp]risma",
    "PrismaService",
    "\\.findMany\\(",
    "\\.create\\("
  ]
}
```

### 예시

**Prisma Detection:**
- File contains: `import { PrismaService } from '@project/database'`
- Matches: `import.*[Pp]risma`
- Activates: `database-verification`

**Controller Detection:**
- File contains: `export class UserController {`
- Matches: `export class.*Controller`
- Activates: `error-tracking`

### 모범 사례

- Match imports: `import.*[Pp]risma` (case-insensitive with [Pp])
- Escape special regex chars: `\\.findMany\\(` not `.findMany(`
- Patterns use case-insensitive flag
- Test against real file content
- Make patterns specific enough to avoid false matches

### 자주 쓰는 콘텐츠 패턴

```regex
# Prisma/Database
import.*[Pp]risma                # Prisma imports
PrismaService                    # PrismaService usage
prisma\.                         # prisma.something
\.findMany\(                     # Prisma query methods
\.create\(
\.update\(
\.delete\(

# Controllers/Routes
export class.*Controller         # Controller classes
router\.                         # Express router
app\.(get|post|put|delete|patch) # Express app routes

# Error Handling
try\s*\{                        # Try blocks
catch\s*\(                      # Catch blocks
throw new                        # Throw statements

# React/Components
export.*React\.FC               # React functional components
export default function.*       # Default function exports
useState|useEffect              # React hooks
```

---

## 모범 사례 요약

### 할 것(DO):
✅ Use specific, unambiguous keywords
✅ Test all patterns with real examples
✅ Include common variations
✅ Use non-greedy regex: `.*?`
✅ Escape special characters in content patterns
✅ Add exclusions for test files
✅ Make file path patterns narrow and specific

### 하지 말 것(DON'T):
❌ Use overly generic keywords ("system", "work")
❌ Make intent patterns too broad (false positives)
❌ Make patterns too specific (false negatives)
❌ Forget to test with regex tester (https://regex101.com/)
❌ Use greedy regex: `.*` instead of `.*?`
❌ Match too broadly in file paths

### 트리거 테스트하기

**키워드/의도 트리거 테스트:**
```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

**파일 경로/콘텐츠 트리거 테스트:**
```bash
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{
  "session_id": "test",
  "tool_name": "Edit",
  "tool_input": {"file_path": "/path/to/test/file.ts"}
}
EOF
```

---

**관련 파일:**
- [SKILL.md](SKILL.md) - Main skill guide
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Complete skill-rules.json schema
- [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md) - 바로 사용할 수 있는 패턴 라이브러리
