# Database Documentation

## Tables

```text
roles
users
sessions
schema_migrations
```

## Relationship

```text
users.role_id → roles.id
```

## Roles

```text
ADMIN
USER
```

## Migration History

```text
001_create_roles
002_create_users
003_create_sessions
004_add_email_verified
```

## Decisions

- Raw SQL is used initially.
- Prisma is postponed.
- Executed migrations are protected by checksums.
- Migration execution uses PostgreSQL advisory locking.
