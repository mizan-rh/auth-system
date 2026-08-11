# Architecture

Target:

```text
Browser
   ↓
Next.js BFF
   ↓
NestJS API
   ↓
PostgreSQL
```

Backend areas:

```text
Auth
Users
Roles
Sessions
Database
```

Authentication state should remain server-side. localStorage will not be the authentication source of truth.
