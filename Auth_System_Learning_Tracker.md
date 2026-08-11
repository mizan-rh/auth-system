# Auth System — Master Learning Tracker

## Project Goal

Build a production-grade authentication system as a learning project using:

- PostgreSQL
- Raw SQL + `pg`
- NestJS
- Next.js BFF
- Server-side sessions
- ADMIN / USER roles
- TypeScript

Prisma is intentionally **not being used yet**. The goal is to first understand PostgreSQL, SQL, database access, transactions, sessions, authentication, and backend architecture at a lower level.

## Learning Method

For every major feature:

1. Learn the theory
2. Design the architecture
3. Design the database
4. Implement
5. Test manually
6. Review the code
7. Add production-grade concerns
8. Document important decisions
9. Commit and push
10. Move to the next milestone

The goal is to understand **why** something is implemented, not only make it work.

---

# Completed Work

## Phase 1 — PostgreSQL Fundamentals

Completed:

- Tables
- Primary keys
- Foreign keys
- UUIDs
- Constraints
- Relationships
- Foreign-key indexing
- Parent/child behavior
- Basic PostgreSQL performance considerations

## Phase 2 — Authentication Database Design

Current database tables:

```text
roles
users
sessions
```

Roles:

```text
ADMIN
USER
```

Relationship:

```text
users.role_id → roles.id
```

The database schema was created and manually verified.

## Phase 3 — Custom Migration System

A custom migration runner was built using:

```text
TypeScript
Node.js
pg
PostgreSQL
```

Migration files:

```text
001_create_roles.sql
002_create_users.sql
003_create_sessions.sql
004_add_email_verified.sql
```

Migration history table:

```text
schema_migrations
```

Columns:

```text
version
name
executed_at
checksum
```

Implemented and tested:

- Migration file discovery
- Migration filename parsing
- Numeric version ordering
- Invalid filename detection
- Duplicate version detection
- Missing applied migration detection
- Migration name mismatch detection
- Migration history lookup
- SHA-256 checksum generation
- Baseline checksum recording
- Modified migration detection
- Transaction per migration
- Rollback on failure
- Migration history insertion
- Error handling
- Connection cleanup

Migration integrity is identified by:

```text
version + name + SQL checksum
```

## Phase 4 — PostgreSQL Advisory Migration Lock

Implemented:

```sql
pg_try_advisory_lock(748392)
```

`748392` is simply the application-specific advisory lock identifier.

Important concept:

PostgreSQL advisory locks are session/connection scoped, so the lock is held through a dedicated `PoolClient`.

Implemented:

- Dedicated lock connection
- Non-blocking lock acquisition
- Retry mechanism
- 10-second timeout
- Fail-fast behavior
- Lock release
- Connection cleanup
- Pool cleanup

## Phase 5 — Concurrency Testing

Two migration processes were executed concurrently.

Expected behavior was confirmed:

```text
Process A
    ↓
acquires lock
    ↓
runs migration
    ↓
releases lock

Process B
    ↓
cannot acquire lock
    ↓
retries
    ↓
times out after 10 seconds
    ↓
fails clearly
```

The test passed as expected.

---

# Migration Runner Final Review

| Feature | Status |
|---|---|
| Migration discovery | ✅ |
| Filename validation | ✅ |
| Version ordering | ✅ |
| Duplicate version detection | ✅ |
| Missing migration detection | ✅ |
| Migration name validation | ✅ |
| Checksum integrity | ✅ |
| Baseline checksum handling | ✅ |
| Transaction + rollback | ✅ |
| Migration history | ✅ |
| Advisory locking | ✅ |
| Retry | ✅ |
| Timeout | ✅ |
| Concurrency protection | ✅ |
| Connection cleanup | ✅ |
| Lock lifecycle | ✅ |

## Decision

**Migration Runner = COMPLETE / FROZEN**

Do not keep adding unnecessary features to it.

---

# Current Position

```text
PostgreSQL fundamentals
        ↓
Database design
        ↓
Custom migration runner
        ↓
Checksum integrity
        ↓
Transactions
        ↓
Advisory migration lock
        ↓
Concurrency testing
        ↓
Final review
        ↓
✅ COMPLETE / FROZEN
```

## Current Milestone

**Migration Runner — COMPLETE / FROZEN**

## Next Milestone

**NestJS + PostgreSQL Database Access Layer**

---

# Next: NestJS + PostgreSQL Database Access Layer

Technology:

```text
NestJS
+
pg
+
Raw SQL
+
PostgreSQL
```

First learn/build:

```text
NestJS project structure
        ↓
Modules
        ↓
Controllers
        ↓
Services
        ↓
Dependency Injection
        ↓
PostgreSQL connection
        ↓
Database module
        ↓
Repository pattern
        ↓
Raw SQL queries
        ↓
Transactions
        ↓
Database result mapping
```

Then connect:

```text
roles
users
sessions
```

tables.

---

# Authentication Roadmap

After the database access layer:

1. Registration
2. Password hashing
3. Login
4. Session creation
5. Session validation
6. Session expiration
7. Logout
8. Authentication guards
9. ADMIN / USER authorization
10. Next.js BFF integration
11. HttpOnly session cookie
12. Security review
13. Production hardening

Target architecture:

```text
Browser
   ↓
Next.js BFF
   ↓
NestJS API
   ↓
PostgreSQL
```

Authentication state should remain server-side. localStorage will not be the authentication source of truth.

---

# Git / Documentation Workflow

Every milestone:

```text
Implement
   ↓
Test
   ↓
Review
   ↓
Update docs
   ↓
Commit
   ↓
Push
   ↓
Next milestone
```

Suggested migration commit:

```text
feat(database): harden migration runner
```

---

# Immediate Action

After committing and pushing the migration work:

1. Start NestJS
2. Learn NestJS module structure
3. Create the database module
4. Connect NestJS to PostgreSQL
5. Build the database access layer

Do not:

- Restart completed migration work
- Add unnecessary migration features
- Introduce Prisma yet
- Jump directly into JWT/session implementation
- Skip understanding the database access layer

---

# Continuation Rule

If this file is uploaded into a new conversation, use it as the source of truth.

Completed:

```text
PostgreSQL fundamentals       ✅
Auth database schema           ✅
Custom migration runner       ✅
Checksum integrity             ✅
Transactions                   ✅
Advisory migration lock        ✅
Concurrency testing            ✅
Migration final review         ✅
```

Current:

```text
Migration Runner — COMPLETE / FROZEN
```

Next:

```text
NestJS + PostgreSQL Database Access Layer
```

Technology:

```text
PostgreSQL + raw SQL + pg
Prisma = not yet
```

Final goal:

```text
Production-grade Auth System
+
ADMIN / USER roles
+
NestJS
+
PostgreSQL
+
Next.js BFF
+
Server-side sessions
```

Do not repeat completed work unless explicitly asked for a review or redesign.
