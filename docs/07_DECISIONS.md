# Engineering Decisions

## PostgreSQL

Primary database.

## Raw SQL

`pg` + raw SQL is used initially to understand database behavior.

## Prisma

Intentionally postponed.

## Migration System

A custom migration runner was built as a learning exercise.

## Advisory Lock

PostgreSQL advisory locking prevents concurrent migration execution.

## Authentication State

Authentication should remain server-side.

## Next.js

Next.js will act as the BFF boundary.

## Browser Storage

localStorage will not be the authentication source of truth.
