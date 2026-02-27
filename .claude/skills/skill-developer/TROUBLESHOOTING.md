# 트러블슈팅 - 스킬 활성화 이슈

스킬 활성화 문제를 디버깅하기 위한 완전한 가이드입니다.

## 목차

- [스킬이 트리거되지 않음](#skill-not-triggering)
  - [UserPromptSubmit이 제안하지 않음](#userpromptsubmit-not-suggesting)
  - [PreToolUse가 차단하지 않음](#pretooluse-not-blocking)
- [오탐(False Positives)](#false-positives)
- [훅이 실행되지 않음](#hook-not-executing)
- [성능 이슈](#performance-issues)

---

## 스킬이 트리거되지 않음

### UserPromptSubmit이 제안하지 않음

**증상:** 질문했는데 출력에 스킬 제안이 나타나지 않습니다.

**흔한 원인:**

####  1. 키워드가 매칭되지 않음

**확인:**
- Look at `promptTriggers.keywords` in skill-rules.json
- Are the keywords actually in your prompt?
- Remember: case-insensitive substring matching

**예시:**
```json
"keywords": ["layout", "grid"]
```
- "how does the layout work?" → ✅ Matches "layout"
- "how does the grid system work?" → ✅ Matches "grid"
- "how do layouts work?" → ✅ Matches "layout"
- "how does it work?" → ❌ No match

**해결:** skill-rules.json에 더 많은 키워드 변형을 추가하세요.

#### 2. 의도 패턴이 너무 구체적임

**Check:**
- Look at `promptTriggers.intentPatterns`
- Test regex at https://regex101.com/
- May need broader patterns

**Example:**
```json
"intentPatterns": [
  "(create|add).*?(database.*?table)"  // Too specific
]
```
- "create a database table" → ✅ Matches
- "add new table" → ❌ Doesn't match (missing "database")

**해결:** 패턴을 더 넓히세요:
```json
"intentPatterns": [
  "(create|add).*?(table|database)"  // Better
]
```

#### 3. 스킬 이름 오타

**Check:**
- Skill name in SKILL.md frontmatter
- Skill name in skill-rules.json
- Must match exactly

**Example:**
```yaml
# SKILL.md
name: project-catalog-developer
```
```json
// skill-rules.json
"project-catalogue-developer": {  // ❌ Typo: catalogue vs catalog
  ...
}
```

**해결:** 이름이 정확히 일치하도록 맞추세요.

#### 4. JSON 문법 오류

**Check:**
```bash
cat .claude/skills/skill-rules.json | jq .
```

JSON이 유효하지 않으면 jq가 오류를 표시합니다.

**흔한 오류:**
- Trailing commas
- Missing quotes
- Single quotes instead of double
- Unescaped characters in strings

**해결:** JSON 문법을 수정하고 jq로 검증하세요.

#### 디버그 명령

훅을 수동으로 테스트하세요:

```bash
echo '{"session_id":"debug","prompt":"your test prompt here"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

기대 결과: 출력에 해당 스킬이 나타나야 합니다.

---

### PreToolUse가 차단하지 않음

**증상:** 가드레일이 트리거되어야 하는 파일을 편집했는데 차단이 발생하지 않습니다.

**Common Causes:**

#### 1. 파일 경로가 패턴과 매칭되지 않음

**Check:**
- File path being edited
- `fileTriggers.pathPatterns` in skill-rules.json
- Glob pattern syntax

**Example:**
```json
"pathPatterns": [
  "frontend/src/**/*.tsx"
]
```
- Editing: `frontend/src/components/Dashboard.tsx` → ✅ Matches
- Editing: `frontend/tests/Dashboard.test.tsx` → ✅ Matches (add exclusion!)
- Editing: `backend/src/app.ts` → ❌ Doesn't match

**해결:** glob 패턴을 조정하거나 누락된 경로를 추가하세요.

#### 2. Excluded by pathExclusions

**Check:**
- Are you editing a test file?
- Look at `fileTriggers.pathExclusions`

**Example:**
```json
"pathExclusions": [
  "**/*.test.ts",
  "**/*.spec.ts"
]
```
- Editing: `services/user.test.ts` → ❌ Excluded
- Editing: `services/user.ts` → ✅ Not excluded

**Fix:** If test exclusion too broad, narrow it or remove

#### 3. Content Pattern Not Found

**Check:**
- Does the file actually contain the pattern?
- Look at `fileTriggers.contentPatterns`
- Is the regex correct?

**Example:**
```json
"contentPatterns": [
  "import.*[Pp]risma"
]
```
- File has: `import { PrismaService } from './prisma'` → ✅ Matches
- File has: `import { Database } from './db'` → ❌ Doesn't match

**Debug:**
```bash
# 파일에 패턴이 존재하는지 확인
grep -i "prisma" path/to/file.ts
```

**Fix:** Adjust content patterns or add missing imports

#### 4. Session Already Used Skill

**Check session state:**
```bash
ls .claude/hooks/state/
cat .claude/hooks/state/skills-used-{session-id}.json
```

**Example:**
```json
{
  "skills_used": ["database-verification"],
  "files_verified": []
}
```

If the skill is in `skills_used`, it won't block again in this session.

**Fix:** Delete the state file to reset:
```bash
rm .claude/hooks/state/skills-used-{session-id}.json
```

#### 5. File Marker Present

**Check file for skip marker:**
```bash
grep "@skip-validation" path/to/file.ts
```

If found, the file is permanently skipped.

**Fix:** Remove the marker if verification is needed again

#### 6. Environment Variable Override

**Check:**
```bash
echo $SKIP_DB_VERIFICATION
echo $SKIP_SKILL_GUARDRAILS
```

If set, the skill is disabled.

**Fix:** Unset the environment variable:
```bash
unset SKIP_DB_VERIFICATION
```

#### Debug Command

Test the hook manually:

```bash
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts 2>&1
{
  "session_id": "debug",
  "tool_name": "Edit",
  "tool_input": {"file_path": "/root/git/your-project/form/src/services/user.ts"}
}
EOF
echo "Exit code: $?"
```

Expected:
- Exit code 2 + stderr message if should block
- Exit code 0 + no output if should allow

---

## 오탐(False Positives)

**Symptoms:** Skill triggers when it shouldn't.

**Common Causes & Solutions:**

### 1. Keywords Too Generic

**Problem:**
```json
"keywords": ["user", "system", "create"]  // Too broad
```
- Triggers on: "user manual", "file system", "create directory"

**Solution:** Make keywords more specific
```json
"keywords": [
  "user authentication",
  "user tracking",
  "create feature"
]
```

### 2. Intent Patterns Too Broad

**Problem:**
```json
"intentPatterns": [
  "(create)"  // Matches everything with "create"
]
```
- Triggers on: "create file", "create folder", "create account"

**Solution:** Add context to patterns
```json
"intentPatterns": [
  "(create|add).*?(database|table|feature)"  // More specific
]
```

**Advanced:** Use negative lookaheads to exclude
```regex
(create)(?!.*test).*?(feature)  // Don't match if "test" appears
```

### 3. File Paths Too Generic

**Problem:**
```json
"pathPatterns": [
  "form/**"  // Matches everything in form/
]
```
- Triggers on: test files, config files, everything

**Solution:** Use narrower patterns
```json
"pathPatterns": [
  "form/src/services/**/*.ts",  // Only service files
  "form/src/controllers/**/*.ts"
]
```

### 4. Content Patterns Catching Unrelated Code

**Problem:**
```json
"contentPatterns": [
  "Prisma"  // Matches in comments, strings, etc.
]
```
- Triggers on: `// Don't use Prisma here`
- Triggers on: `const note = "Prisma is cool"`

**Solution:** Make patterns more specific
```json
"contentPatterns": [
  "import.*[Pp]risma",        // Only imports
  "PrismaService\\.",         // Only actual usage
  "prisma\\.(findMany|create)" // Specific methods
]
```

### 5. Adjust Enforcement Level

**Last resort:** If false positives are frequent:

```json
{
  "enforcement": "block"  // Change to "suggest"
}
```

This makes it advisory instead of blocking.

---

## 훅이 실행되지 않음

**Symptoms:** Hook doesn't run at all - no suggestion, no block.

**Common Causes:**

### 1. Hook Not Registered

**Check `.claude/settings.json`:**
```bash
cat .claude/settings.json | jq '.hooks.UserPromptSubmit'
cat .claude/settings.json | jq '.hooks.PreToolUse'
```

Expected: Hook entries present

**Fix:** Add missing hook registration:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

### 2. Bash Wrapper Not Executable

**Check:**
```bash
ls -l .claude/hooks/*.sh
```

Expected: `-rwxr-xr-x` (executable)

**Fix:**
```bash
chmod +x .claude/hooks/*.sh
```

### 3. Incorrect Shebang

**Check:**
```bash
head -1 .claude/hooks/skill-activation-prompt.sh
```

Expected: `#!/bin/bash`

**Fix:** Add correct shebang to first line

### 4. npx/tsx Not Available

**Check:**
```bash
npx tsx --version
```

Expected: Version number

**Fix:** Install dependencies:
```bash
cd .claude/hooks
npm install
```

### 5. TypeScript Compilation Error

**Check:**
```bash
cd .claude/hooks
npx tsc --noEmit skill-activation-prompt.ts
```

Expected: No output (no errors)

**Fix:** Correct TypeScript syntax errors

---

## 성능 이슈

**Symptoms:** Hooks are slow, noticeable delay before prompt/edit.

**Common Causes:**

### 1. Too Many Patterns

**Check:**
- Count patterns in skill-rules.json
- Each pattern = regex compilation + matching

**Solution:** Reduce patterns
- Combine similar patterns
- Remove redundant patterns
- Use more specific patterns (faster matching)

### 2. Complex Regex

**Problem:**
```regex
(create|add|modify|update|implement|build).*?(feature|endpoint|route|service|controller|component|UI|page)
```
- Long alternations = slow

**Solution:** Simplify
```regex
(create|add).*?(feature|endpoint)  // Fewer alternatives
```

### 3. Too Many Files Checked

**Problem:**
```json
"pathPatterns": [
  "**/*.ts"  // Checks ALL TypeScript files
]
```

**Solution:** Be more specific
```json
"pathPatterns": [
  "form/src/services/**/*.ts",  // Only specific directory
  "form/src/controllers/**/*.ts"
]
```

### 4. Large Files

Content pattern matching reads entire file - slow for large files.

**Solution:**
- Only use content patterns when necessary
- Consider file size limits (future enhancement)

### 성능 측정

```bash
# UserPromptSubmit
time echo '{"prompt":"test"}' | npx tsx .claude/hooks/skill-activation-prompt.ts

# PreToolUse
time cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}
EOF
```

**Target metrics:**
- UserPromptSubmit: < 100ms
- PreToolUse: < 200ms

---

**Related Files:**
- [SKILL.md](SKILL.md) - Main skill guide
- [HOOK_MECHANISMS.md](HOOK_MECHANISMS.md) - How hooks work
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Configuration reference
