---
name: skill-developer
description: Anthropic 모범 사례에 따라 Claude Code 스킬을 만들고 관리합니다. 새 스킬 생성, skill-rules.json 수정, 트리거 패턴 이해, 훅 작업, 스킬 활성화 디버깅, 점진적 공개(progressive disclosure) 구현 시 사용하세요. 스킬 구조, YAML 프론트매터, 트리거 유형(키워드, 의도 패턴, 파일 경로, 콘텐츠 패턴), enforcement 레벨(block/suggest/warn), 훅 메커니즘(UserPromptSubmit/PreToolUse), 세션 추적, 500줄 규칙을 다룹니다.
---

# 스킬 개발자 가이드

## 목적

자동 활성화 시스템이 있는 Claude Code에서 스킬을 만들고 관리하기 위한 포괄 가이드입니다. 500줄 규칙과 점진적 공개(progressive disclosure) 패턴을 포함한 Anthropic 공식 모범 사례를 따릅니다.

## 이 스킬을 사용해야 하는 경우

다음 내용을 언급하면 자동으로 활성화됩니다:
- 스킬 생성/추가
- 스킬 트리거/규칙 수정
- 스킬 활성화 동작 방식 이해
- 스킬 활성화 이슈 디버깅
- skill-rules.json 작업
- 훅 시스템 메커니즘
- Claude Code 모범 사례
- 점진적 공개(progressive disclosure)
- YAML 프론트매터
- 500줄 규칙

---

## 시스템 개요

### 2-훅 아키텍처

**1. UserPromptSubmit 훅** (선제적 제안)
- **File**: `.claude/hooks/skill-activation-prompt.ts`
- **Trigger**: BEFORE Claude sees user's prompt
- **목적**: 키워드 + 의도 패턴을 기반으로 관련 스킬 제안
- **Method**: Injects formatted reminder as context (stdout → Claude's input)
- **Use Cases**: Topic-based skills, implicit work detection

**2. Stop 훅 - 에러 처리 리마인더** (부드러운 리마인더)
- **File**: `.claude/hooks/error-handling-reminder.ts`
- **Trigger**: AFTER Claude finishes responding
- **목적**: 작성한 코드의 에러 처리를 스스로 점검하도록 부드럽게 리마인드
- **Method**: Analyzes edited files for risky patterns, displays reminder if needed
- **Use Cases**: Error handling awareness without blocking friction

**철학 변경(2025-10-27):** Sentry/에러 처리에 대해 PreToolUse로 차단하던 방식에서 벗어났습니다. 대신 워크플로를 막지 않으면서 코드 품질 인식을 유지하는, 응답 이후의 부드러운 리마인더를 사용합니다.

### 설정 파일

**Location**: `.claude/skills/skill-rules.json`

정의 내용:
- All skills and their trigger conditions
- Enforcement levels (block, suggest, warn)
- File path patterns (glob)
- Content detection patterns (regex)
- Skip conditions (session tracking, file markers, env vars)

---

## 스킬 유형

### 1. 가드레일(Guardrail) 스킬

**목적:** 오류를 방지하는 핵심 모범 사례를 강제

**특징:**
- Type: `"guardrail"`
- Enforcement: `"block"`
- Priority: `"critical"` or `"high"`
- Block file edits until skill used
- Prevent common mistakes (column names, critical errors)
- Session-aware (don't repeat nag in same session)

**예시:**
- `database-verification` - Verify table/column names before Prisma queries
- `frontend-dev-guidelines` - Enforce React/TypeScript patterns

**사용 시점:**
- Mistakes that cause runtime errors
- Data integrity concerns
- Critical compatibility issues

### 2. 도메인(Domain) 스킬

**목적:** 특정 영역에 대한 포괄적인 가이드를 제공

**특징:**
- Type: `"domain"`
- Enforcement: `"suggest"`
- Priority: `"high"` or `"medium"`
- Advisory, not mandatory
- Topic or domain-specific
- Comprehensive documentation

**예시:**
- `backend-dev-guidelines` - Node.js/Express/TypeScript patterns
- `frontend-dev-guidelines` - React/TypeScript best practices
- `error-tracking` - Sentry integration guidance

**사용 시점:**
- Complex systems requiring deep knowledge
- Best practices documentation
- Architectural patterns
- How-to guides

---

## 빠른 시작: 새 스킬 만들기

### 1단계: 스킬 파일 만들기

**위치:** `.claude/skills/{skill-name}/SKILL.md`

**템플릿:**
```markdown
---
name: my-new-skill
description: Brief description including keywords that trigger this skill. Mention topics, file types, and use cases. Be explicit about trigger terms.
---

# My New Skill

## Purpose
What this skill helps with

## When to Use
Specific scenarios and conditions

## Key Information
The actual guidance, documentation, patterns, examples
```

**모범 사례:**
- ✅ **Name**: Lowercase, hyphens, gerund form (verb + -ing) preferred
- ✅ **Description**: Include ALL trigger keywords/phrases (max 1024 chars)
- ✅ **Content**: Under 500 lines - use reference files for details
- ✅ **Examples**: Real code examples
- ✅ **Structure**: Clear headings, lists, code blocks

### 2단계: skill-rules.json에 추가

See [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) for complete schema.

**Basic Template:**
```json
{
  "my-new-skill": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "medium",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["(create|add).*?something"]
    }
  }
}
```

### 3단계: 트리거 테스트

**Test UserPromptSubmit:**
```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

**Test PreToolUse:**
```bash
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{"session_id":"test","tool_name":"Edit","tool_input":{"file_path":"test.ts"}}
EOF
```

### 4단계: 패턴 개선

테스트 결과를 바탕으로:
- Add missing keywords
- Refine intent patterns to reduce false positives
- Adjust file path patterns
- Test content patterns against actual files

### 5단계: Anthropic 모범 사례 준수

✅ Keep SKILL.md under 500 lines
✅ Use progressive disclosure with reference files
✅ Add table of contents to reference files > 100 lines
✅ Write detailed description with trigger keywords
✅ Test with 3+ real scenarios before documenting
✅ Iterate based on actual usage

---

## Enforcement 레벨

### BLOCK(핵심 가드레일)

- Physically prevents Edit/Write tool execution
- Exit code 2 from hook, stderr → Claude
- Claude sees message and must use skill to proceed
- **Use For**: Critical mistakes, data integrity, security issues

**예시:** DB 컬럼명 검증

### SUGGEST(권장)

- Reminder injected before Claude sees prompt
- Claude is aware of relevant skills
- Not enforced, just advisory
- **Use For**: Domain guidance, best practices, how-to guides

**예시:** 프론트엔드 개발 가이드라인

### WARN(선택)

- Low priority suggestions
- Advisory only, minimal enforcement
- **Use For**: Nice-to-have suggestions, informational reminders

**거의 사용하지 않음** - 대부분의 스킬은 BLOCK 또는 SUGGEST입니다.

---

## 스킵 조건 & 사용자 제어

### 1. 세션 추적

**목적:** 같은 세션에서 반복 차단/잔소리 방지

**How it works:**
- First edit → Hook blocks, updates session state
- Second edit (same session) → Hook allows
- Different session → Blocks again

**State File:** `.claude/hooks/state/skills-used-{session_id}.json`

### 2. 파일 마커

**목적:** 검증된 파일은 영구적으로 스킵

**Marker:** `// @skip-validation`

**Usage:**
```typescript
// @skip-validation
import { PrismaService } from './prisma';
// This file has been manually verified
```

**주의:** 남용하면 목적을 무력화합니다. 필요한 경우에만 사용하세요.

### 3. 환경 변수

**목적:** 긴급 비활성화, 임시 오버라이드

**Global disable:**
```bash
export SKIP_SKILL_GUARDRAILS=true  # Disables ALL PreToolUse blocks
```

**Skill-specific:**
```bash
export SKIP_DB_VERIFICATION=true
export SKIP_ERROR_REMINDER=true
```

---

## 테스트 체크리스트

When creating a new skill, verify:

- [ ] Skill file created in `.claude/skills/{name}/SKILL.md`
- [ ] Proper frontmatter with name and description
- [ ] Entry added to `skill-rules.json`
- [ ] Keywords tested with real prompts
- [ ] Intent patterns tested with variations
- [ ] File path patterns tested with actual files
- [ ] Content patterns tested against file contents
- [ ] Block message is clear and actionable (if guardrail)
- [ ] Skip conditions configured appropriately
- [ ] Priority level matches importance
- [ ] No false positives in testing
- [ ] No false negatives in testing
- [ ] Performance is acceptable (<100ms or <200ms)
- [ ] JSON syntax validated: `jq . skill-rules.json`
- [ ] **SKILL.md under 500 lines** ⭐
- [ ] Reference files created if needed
- [ ] Table of contents added to files > 100 lines

---

## 레퍼런스 파일

For detailed information on specific topics, see:

### [TRIGGER_TYPES.md](TRIGGER_TYPES.md)
모든 트리거 유형에 대한 완전한 가이드:
- Keyword triggers (explicit topic matching)
- Intent patterns (implicit action detection)
- File path triggers (glob patterns)
- Content patterns (regex in files)
- Best practices and examples for each
- Common pitfalls and testing strategies

### [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md)
Complete skill-rules.json schema:
- Full TypeScript interface definitions
- Field-by-field explanations
- Complete guardrail skill example
- Complete domain skill example
- Validation guide and common errors

### [HOOK_MECHANISMS.md](HOOK_MECHANISMS.md)
Deep dive into hook internals:
- UserPromptSubmit flow (detailed)
- PreToolUse flow (detailed)
- Exit code behavior table (CRITICAL)
- Session state management
- Performance considerations

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
Comprehensive debugging guide:
- Skill not triggering (UserPromptSubmit)
- PreToolUse not blocking
- False positives (too many triggers)
- Hook not executing at all
- Performance issues

### [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md)
바로 사용할 수 있는 패턴 모음:
- Intent pattern library (regex)
- File path pattern library (glob)
- Content pattern library (regex)
- Organized by use case
- Copy-paste ready

### [ADVANCED.md](ADVANCED.md)
Future enhancements and ideas:
- Dynamic rule updates
- Skill dependencies
- Conditional enforcement
- Skill analytics
- Skill versioning

---

## 빠른 참조 요약

### 새 스킬 만들기(5단계)

1. Create `.claude/skills/{name}/SKILL.md` with frontmatter
2. Add entry to `.claude/skills/skill-rules.json`
3. Test with `npx tsx` commands
4. Refine patterns based on testing
5. Keep SKILL.md under 500 lines

### 트리거 유형

- **Keywords**: Explicit topic mentions
- **Intent**: Implicit action detection
- **File Paths**: Location-based activation
- **Content**: Technology-specific detection

See [TRIGGER_TYPES.md](TRIGGER_TYPES.md) for complete details.

### Enforcement

- **BLOCK**: Exit code 2, critical only
- **SUGGEST**: Inject context, most common
- **WARN**: Advisory, rarely used

### 스킵 조건

- **Session tracking**: Automatic (prevents repeated nags)
- **File markers**: `// @skip-validation` (permanent skip)
- **Env vars**: `SKIP_SKILL_GUARDRAILS` (emergency disable)

### Anthropic 모범 사례

✅ **500-line rule**: Keep SKILL.md under 500 lines
✅ **Progressive disclosure**: Use reference files for details
✅ **Table of contents**: Add to reference files > 100 lines
✅ **One level deep**: Don't nest references deeply
✅ **Rich descriptions**: Include all trigger keywords (max 1024 chars)
✅ **Test first**: Build 3+ evaluations before extensive documentation
✅ **Gerund naming**: Prefer verb + -ing (e.g., "processing-pdfs")

### 트러블슈팅

Test hooks manually:
```bash
# UserPromptSubmit
echo '{"prompt":"test"}' | npx tsx .claude/hooks/skill-activation-prompt.ts

# PreToolUse
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}
EOF
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for complete debugging guide.

---

## 관련 파일

**Configuration:**
- `.claude/skills/skill-rules.json` - Master configuration
- `.claude/hooks/state/` - Session tracking
- `.claude/settings.json` - Hook registration

**Hooks:**
- `.claude/hooks/skill-activation-prompt.ts` - UserPromptSubmit
- `.claude/hooks/error-handling-reminder.ts` - Stop event (gentle reminders)

**All Skills:**
- `.claude/skills/*/SKILL.md` - Skill content files

---

**Skill Status**: COMPLETE - Restructured following Anthropic best practices ✅
**Line Count**: < 500 (following 500-line rule) ✅
**Progressive Disclosure**: Reference files for detailed information ✅

**Next**: Create more skills, refine patterns based on usage
