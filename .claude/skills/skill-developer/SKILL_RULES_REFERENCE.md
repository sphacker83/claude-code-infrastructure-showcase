# skill-rules.json - 완전 레퍼런스

`.claude/skills/skill-rules.json`의 스키마와 설정에 대한 완전 레퍼런스입니다.

## 목차

- [파일 위치](#file-location)
- [전체 TypeScript 스키마](#complete-typescript-schema)
- [필드 가이드](#field-guide)
- [예시: 가드레일 스킬](#example-guardrail-skill)
- [예시: 도메인 스킬](#example-domain-skill)
- [검증](#validation)

---

## 파일 위치

**Path:** `.claude/skills/skill-rules.json`

이 JSON 파일은 자동 활성화 시스템을 위해, 모든 스킬과 트리거 조건을 정의합니다.

---

## 전체 TypeScript 스키마

```typescript
interface SkillRules {
    version: string;
    skills: Record<string, SkillRule>;
}

interface SkillRule {
    type: 'guardrail' | 'domain';
    enforcement: 'block' | 'suggest' | 'warn';
    priority: 'critical' | 'high' | 'medium' | 'low';

    promptTriggers?: {
        keywords?: string[];
        intentPatterns?: string[];  // Regex strings
    };

    fileTriggers?: {
        pathPatterns: string[];     // Glob patterns
        pathExclusions?: string[];  // Glob patterns
        contentPatterns?: string[]; // Regex strings
        createOnly?: boolean;       // Only trigger on file creation
    };

    blockMessage?: string;  // For guardrails, {file_path} placeholder

    skipConditions?: {
        sessionSkillUsed?: boolean;      // Skip if used in session
        fileMarkers?: string[];          // e.g., ["@skip-validation"]
        envOverride?: string;            // e.g., "SKIP_DB_VERIFICATION"
    };
}
```

---

## 필드 가이드

### 최상위(Top Level)

| 필드 | 타입 | 필수 | 설명 |
|-------|------|----------|-------------|
| `version` | string | 예 | 스키마 버전(현재 "1.0") |
| `skills` | object | 예 | 스킬 이름 → SkillRule 매핑 |

### SkillRule 필드

| 필드 | 타입 | 필수 | 설명 |
|-------|------|----------|-------------|
| `type` | string | 예 | "guardrail"(강제) 또는 "domain"(안내) |
| `enforcement` | string | 예 | "block"(PreToolUse), "suggest"(UserPromptSubmit), 또는 "warn" |
| `priority` | string | 예 | "critical", "high", "medium", 또는 "low" |
| `promptTriggers` | object | 선택 | UserPromptSubmit 훅 트리거 |
| `fileTriggers` | object | 선택 | PreToolUse 훅 트리거 |
| `blockMessage` | string | 선택* | enforcement="block"이면 필수. `{file_path}` 플레이스홀더 사용 |
| `skipConditions` | object | 선택 | 우회(escape hatch) 및 세션 추적 |

*가드레일(guardrail)에는 필수

### promptTriggers 필드

| 필드 | 타입 | 필수 | 설명 |
|-------|------|----------|-------------|
| `keywords` | string[] | 선택 | 부분 문자열 정확 매칭(대소문자 무시) |
| `intentPatterns` | string[] | 선택 | 의도 감지를 위한 정규식 패턴 |

### fileTriggers 필드

| 필드 | 타입 | 필수 | 설명 |
|-------|------|----------|-------------|
| `pathPatterns` | string[] | 예* | 파일 경로용 glob 패턴 |
| `pathExclusions` | string[] | 선택 | 제외할 glob 패턴(예: 테스트 파일) |
| `contentPatterns` | string[] | 선택 | 파일 내용을 매칭하는 정규식 패턴 |
| `createOnly` | boolean | 선택 | 새 파일 생성 시에만 트리거 |

*fileTriggers가 있으면 필수

### skipConditions 필드

| 필드 | 타입 | 필수 | 설명 |
|-------|------|----------|-------------|
| `sessionSkillUsed` | boolean | 선택 | 이 세션에서 이미 스킬을 사용했으면 스킵 |
| `fileMarkers` | string[] | 선택 | 파일에 코멘트 마커가 있으면 스킵 |
| `envOverride` | string | 선택 | 스킬 비활성화를 위한 환경 변수 이름 |

---

## 예시: 가드레일(Guardrail) 스킬

모든 기능을 포함한 차단형 가드레일 스킬 완전 예시:

```json
{
  "database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",

    "promptTriggers": {
      "keywords": [
        "prisma",
        "database",
        "table",
        "column",
        "schema",
        "query",
        "migration"
      ],
      "intentPatterns": [
        "(add|create|implement).*?(user|login|auth|tracking|feature)",
        "(modify|update|change).*?(table|column|schema|field)",
        "database.*?(change|update|modify|migration)"
      ]
    },

    "fileTriggers": {
      "pathPatterns": [
        "**/schema.prisma",
        "**/migrations/**/*.sql",
        "database/src/**/*.ts",
        "form/src/**/*.ts",
        "email/src/**/*.ts",
        "users/src/**/*.ts",
        "projects/src/**/*.ts",
        "utilities/src/**/*.ts"
      ],
      "pathExclusions": [
        "**/*.test.ts",
        "**/*.spec.ts"
      ],
      "contentPatterns": [
        "import.*[Pp]risma",
        "PrismaService",
        "prisma\\.",
        "\\.findMany\\(",
        "\\.findUnique\\(",
        "\\.findFirst\\(",
        "\\.create\\(",
        "\\.createMany\\(",
        "\\.update\\(",
        "\\.updateMany\\(",
        "\\.upsert\\(",
        "\\.delete\\(",
        "\\.deleteMany\\("
      ]
    },

    "blockMessage": "⚠️ BLOCKED - Database Operation Detected\n\n📋 REQUIRED ACTION:\n1. Use Skill tool: 'database-verification'\n2. Verify ALL table and column names against schema\n3. Check database structure with DESCRIBE commands\n4. Then retry this edit\n\nReason: Prevent column name errors in Prisma queries\nFile: {file_path}\n\n💡 TIP: Add '// @skip-validation' comment to skip future checks",

    "skipConditions": {
      "sessionSkillUsed": true,
      "fileMarkers": [
        "@skip-validation"
      ],
      "envOverride": "SKIP_DB_VERIFICATION"
    }
  }
}
```

### 가드레일 핵심 포인트

1. **type**: Must be "guardrail"
2. **enforcement**: Must be "block"
3. **priority**: Usually "critical" or "high"
4. **blockMessage**: Required, clear actionable steps
5. **skipConditions**: Session tracking prevents repeated nagging
6. **fileTriggers**: Usually has both path and content patterns
7. **contentPatterns**: Catch actual usage of technology

---

## 예시: 도메인(Domain) 스킬

제안(suggest) 기반 도메인 스킬의 완전 예시:

```json
{
  "project-catalog-developer": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",

    "promptTriggers": {
      "keywords": [
        "layout",
        "layout system",
        "grid",
        "grid layout",
        "toolbar",
        "column",
        "cell editor",
        "cell renderer",
        "submission",
        "submissions",
        "blog dashboard",
        "datagrid",
        "data grid",
        "CustomToolbar",
        "GridLayoutDialog",
        "useGridLayout",
        "auto-save",
        "column order",
        "column width",
        "filter",
        "sort"
      ],
      "intentPatterns": [
        "(how does|how do|explain|what is|describe).*?(layout|grid|toolbar|column|submission|catalog)",
        "(add|create|modify|change).*?(toolbar|column|cell|editor|renderer)",
        "blog dashboard.*?"
      ]
    },

    "fileTriggers": {
      "pathPatterns": [
        "frontend/src/features/submissions/**/*.tsx",
        "frontend/src/features/submissions/**/*.ts"
      ],
      "pathExclusions": [
        "**/*.test.tsx",
        "**/*.test.ts"
      ]
    }
  }
}
```

### 도메인 스킬 핵심 포인트

1. **type**: Must be "domain"
2. **enforcement**: Usually "suggest"
3. **priority**: "high" or "medium"
4. **blockMessage**: Not needed (doesn't block)
5. **skipConditions**: Optional (less critical)
6. **promptTriggers**: Usually has extensive keywords
7. **fileTriggers**: May have only path patterns (content less important)

---

## 검증

### JSON 문법 확인

```bash
cat .claude/skills/skill-rules.json | jq .
```

정상이면 jq가 JSON을 보기 좋게 출력합니다. 비정상이면 오류를 표시합니다.

### 흔한 JSON 오류

**Trailing comma:**
```json
{
  "keywords": ["one", "two",]  // ❌ Trailing comma
}
```

**Missing quotes:**
```json
{
  type: "guardrail"  // ❌ Missing quotes on key
}
```

**Single quotes (invalid JSON):**
```json
{
  'type': 'guardrail'  // ❌ Must use double quotes
}
```

### 검증 체크리스트

- [ ] JSON syntax valid (use `jq`)
- [ ] All skill names match SKILL.md filenames
- [ ] Guardrails have `blockMessage`
- [ ] Block messages use `{file_path}` placeholder
- [ ] Intent patterns are valid regex (test on regex101.com)
- [ ] File path patterns use correct glob syntax
- [ ] Content patterns escape special characters
- [ ] Priority matches enforcement level
- [ ] No duplicate skill names

---

**관련 파일:**
- [SKILL.md](SKILL.md) - Main skill guide
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Complete trigger documentation
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debugging configuration issues
