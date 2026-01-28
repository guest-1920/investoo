# 🏗️ Wallet System Backend - Architecture Documentation

> **Version**: 1.0.0  
> **Framework**: NestJS 11 + TypeORM + PostgreSQL  
> **Last Updated**: January 9, 2026

---

## 📚 Table of Contents

1. [System Overview](#system-overview)
2. [Module Architecture](#module-architecture)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Financial Transaction Safety](#financial-transaction-safety)
6. [API Endpoints](#api-endpoints)
7. [Request Lifecycle](#request-lifecycle)
8. [Security Implementation](#security-implementation)
9. [CRUD Infrastructure](#crud-infrastructure)
10. [Deployment Configuration](#deployment-configuration)

---

## System Overview

The Wallet System Backend is a financial management platform built with NestJS that provides:

- **User Authentication** - JWT-based auth with role-based access control
- **Wallet Management** - Digital wallet with credit/debit operations
- **Recharge System** - Request-approval workflow for adding funds
- **Withdrawal System** - Request-approval workflow for withdrawing funds
- **Subscription Plans** - Purchasable plans with validity periods
- **Daily Returns** - Automatic daily credits to subscribers based on plan
- **Referral System** - Referral rewards on plan purchases

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOB[Mobile App]
        ADM[Admin Panel]
    end
    
    subgraph "API Gateway Layer"
        CORS[CORS Filter]
        HELMET[Helmet Security]
        THROTTLE[Rate Limiter]
    end
    
    subgraph "Application Layer"
        AUTH[Auth Module]
        USERS[Users Module]
        WALLET[Wallet Module]
        RECHARGE[Recharge Module]
        WITHDRAW[Withdrawals Module]
        PLANS[Plans Module]
        SUBS[Subscriptions Module]
        HEALTH[Health Module]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
    end
    
    WEB --> CORS
    MOB --> CORS
    ADM --> CORS
    
    CORS --> HELMET
    HELMET --> THROTTLE
    
    THROTTLE --> AUTH
    THROTTLE --> USERS
    THROTTLE --> WALLET
    THROTTLE --> RECHARGE
    THROTTLE --> WITHDRAW
    THROTTLE --> PLANS
    THROTTLE --> SUBS
    THROTTLE --> HEALTH
    
    AUTH --> PG
    USERS --> PG
    WALLET --> PG
    RECHARGE --> PG
    WITHDRAW --> PG
    PLANS --> PG
    SUBS --> PG
```

---

## Module Architecture

### Module Dependency Graph

```mermaid
graph LR
    subgraph "Core Modules"
        APP[AppModule]
        COMMON[Common Module]
    end
    
    subgraph "Auth Layer"
        AUTH[AuthModule]
        USERS[UsersModule]
    end
    
    subgraph "Business Layer"
        WALLET[WalletModule]
        PLANS[PlansModule]
        SUBS[SubscriptionsModule]
        RECHARGE[RechargeModule]
        WITHDRAW[WithdrawalsModule]
    end
    
    subgraph "Infrastructure"
        HEALTH[HealthModule]
        SCHED[ScheduleModule]
    end
    
    APP --> AUTH
    APP --> USERS
    APP --> WALLET
    APP --> PLANS
    APP --> SUBS
    APP --> RECHARGE
    APP --> WITHDRAW
    APP --> HEALTH
    APP --> SCHED
    
    AUTH --> USERS
    SUBS --> WALLET
    SUBS --> PLANS
    SUBS --> USERS
    RECHARGE --> WALLET
    WITHDRAW --> WALLET
```

### Module Structure Pattern

Each module follows a consistent structure:

```
module/
├── module.module.ts       # Module definition
├── module.controller.ts   # HTTP endpoints
├── module.service.ts      # Business logic
├── module.entity.ts       # TypeORM entity
├── dto/
│   ├── create-*.dto.ts    # Create DTOs
│   └── update-*.dto.ts    # Update DTOs
└── enums/                 # Module enums (optional)
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ WALLET_TRANSACTIONS : "has"
    USERS ||--o{ RECHARGE_REQUESTS : "creates"
    USERS ||--o{ WITHDRAWAL_REQUESTS : "creates"
    USERS ||--o{ SUBSCRIPTIONS : "purchases"
    USERS ||--o{ DAILY_RETURN_LOGS : "receives"
    USERS ||--o| USERS : "referredBy"
    PLANS ||--o{ SUBSCRIPTIONS : "purchased_as"
    PLANS ||--o{ DAILY_RETURN_LOGS : "generates"
    SUBSCRIPTIONS ||--o{ DAILY_RETURN_LOGS : "produces"
    WALLET_TRANSACTIONS ||--o| DAILY_RETURN_LOGS : "created_from"
    
    USERS {
        uuid id PK
        string name
        string email UK
        string password
        enum role "USER|ADMIN"
        numeric wallet_balance
        string referral_code UK
        uuid referred_by FK
        timestamp created_at
        timestamp updated_at
        boolean deleted
    }
    
    WALLET_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        enum type "CREDIT|DEBIT"
        numeric amount
        enum source "RECHARGE|PURCHASE|WITHDRAW|REFERRAL_BONUS|DAILY_RETURN"
        uuid reference_id
        enum status "PENDING|SUCCESS|FAILED"
        timestamp created_at
    }
    
    RECHARGE_REQUESTS {
        uuid id PK
        uuid user_id FK
        numeric amount
        string payment_method
        string proof
        enum status "PENDING|APPROVED|REJECTED"
        string admin_remark
        timestamp created_at
    }
    
    WITHDRAWAL_REQUESTS {
        uuid id PK
        uuid user_id FK
        numeric amount
        string payout_method
        string payout_details
        enum status "PENDING|APPROVED|REJECTED"
        string admin_remark
        timestamp created_at
    }
    
    PLANS {
        uuid id PK
        string name
        numeric price
        integer validity
        string description
        enum status "ACTIVE|INACTIVE"
        numeric referral_reward
        numeric daily_return
        timestamp created_at
    }
    
    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        timestamp start_date
        timestamp end_date
        boolean is_active
        timestamp created_at
    }
    
    DAILY_RETURN_LOGS {
        uuid id PK
        uuid subscription_id FK
        uuid user_id FK
        uuid plan_id FK
        numeric amount
        date credited_for_date
        uuid wallet_transaction_id FK
        timestamp created_at
    }
```

### Database Indexes

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| `users` | `IDX_user_email` | `email` | Unique email lookup |
| `users` | `IDX_user_referral_code` | `referral_code` | Referral lookup |
| `users` | `IDX_user_referred_by` | `referred_by` | Referrer queries |
| `wallet_transactions` | `IDX_wallet_tx_user_status` | `user_id, status` | Balance calculation |
| `wallet_transactions` | `IDX_wallet_tx_user_created` | `user_id, created_at` | Ledger queries |
| `recharge_requests` | `IDX_recharge_status` | `status` | Pending list |
| `withdrawal_requests` | `IDX_withdrawal_status` | `status` | Pending list |
| `subscriptions` | `IDX_subscription_user_active` | `user_id, is_active` | Active subscription |
| `plans` | `IDX_plan_status` | `status` | Active plans |
| `daily_return_logs` | `UQ_daily_return_subscription_date` | `subscription_id, credited_for_date` | Prevent duplicate credits |
| `daily_return_logs` | `IDX_daily_return_user` | `user_id` | User's return history |
| `daily_return_logs` | `IDX_daily_return_date` | `credited_for_date` | Date-based queries |

---

## Authentication Flow

### Registration Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant US as UsersService
    participant DB as PostgreSQL
    participant JWT as JwtService
    
    C->>AC: POST /auth/register
    AC->>AS: register(dto)
    AS->>US: findByEmail(email)
    US->>DB: SELECT * FROM users WHERE email = ?
    DB-->>US: null (not found)
    US-->>AS: null
    
    AS->>AS: bcrypt.hash(password, 10)
    AS->>AS: generateReferralCode()
    
    alt Has Referral Code
        AS->>US: findByReferralCode(code)
        US->>DB: SELECT * FROM users WHERE referral_code = ?
        DB-->>US: Referrer User
        US-->>AS: referrerId
    end
    
    AS->>US: create(userData)
    US->>DB: INSERT INTO users
    DB-->>US: New User
    US-->>AS: User
    
    AS->>JWT: sign({sub: userId, role})
    JWT-->>AS: accessToken
    
    AS-->>AC: {accessToken, role}
    AC->>C: Set-Cookie: access_token=...
    AC-->>C: 201 {accessToken, role}
```

### Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant US as UsersService
    participant DB as PostgreSQL
    participant JWT as JwtService
    
    C->>AC: POST /auth/login
    AC->>AS: login(dto)
    
    AS->>US: findByEmailWithPassword(email)
    US->>DB: SELECT user with password
    
    alt User Not Found
        DB-->>US: null
        US-->>AS: null
        AS-->>AC: UnauthorizedException
        AC-->>C: 401 Unauthorized
    end
    
    DB-->>US: User with password
    US-->>AS: User
    
    AS->>AS: bcrypt.compare passwords
    
    alt Password Mismatch
        AS-->>AC: UnauthorizedException
        AC-->>C: 401 Unauthorized
    end
    
    AS->>JWT: sign payload
    JWT-->>AS: accessToken
    AS-->>AC: accessToken + role
    
    Note over AC: Set HttpOnly Cookie
    AC->>C: Set-Cookie with token
    AC-->>C: 200 OK with token and role
    
    Note over C: Frontend redirects based on role
```

### JWT Authentication Guard Flow

```mermaid
flowchart TD
    REQ[Incoming Request] --> EXTRACT{Extract Token}
    
    EXTRACT --> |Cookie| COOKIE[access_token cookie]
    EXTRACT --> |Header| BEARER[Authorization: Bearer ...]
    
    COOKIE --> VERIFY{Verify JWT}
    BEARER --> VERIFY
    
    VERIFY --> |Invalid| REJECT[401 Unauthorized]
    VERIFY --> |Valid| DECODE[Decode Payload]
    
    DECODE --> ATTACH[req.user = payload]
    ATTACH --> GUARD{RolesGuard?}
    
    GUARD --> |No| PROCEED[Proceed to Controller]
    GUARD --> |Yes| CHECKROLE{Check Role}
    
    CHECKROLE --> |Authorized| PROCEED
    CHECKROLE --> |Unauthorized| FORBIDDEN[403 Forbidden]
```

---

## Financial Transaction Safety

### Race Condition Prevention

> [!IMPORTANT]
> All financial operations use **database transactions with pessimistic locking** to prevent race conditions.

### Wallet Debit Flow (with Pessimistic Locking)

```mermaid
sequenceDiagram
    participant C as Client
    participant WC as WalletController
    participant WS as WalletService
    participant DB as PostgreSQL
    
    C->>WC: Request (e.g., Purchase)
    WC->>WS: debit(userId, amount, source)
    
    rect rgb(255, 230, 230)
        Note over WS,DB: DATABASE TRANSACTION START
        
        WS->>DB: BEGIN TRANSACTION
        WS->>DB: SELECT ... FOR UPDATE (PESSIMISTIC_WRITE)
        Note over DB: Rows are LOCKED
        
        DB-->>WS: Current Balance
        
        alt Insufficient Balance
            WS->>DB: ROLLBACK
            WS-->>WC: throw BadRequestException
        end
        
        WS->>DB: INSERT wallet_transaction (DEBIT)
        DB-->>WS: Transaction Created
        
        WS->>DB: COMMIT
        Note over DB: Rows are UNLOCKED
    end
    
    WS-->>WC: WalletTransaction
    WC-->>C: 200 OK
```

### Subscription Purchase (Atomic Transaction)

```mermaid
sequenceDiagram
    participant C as Client
    participant SC as SubscriptionsController
    participant SS as SubscriptionsService
    participant WS as WalletService
    participant DB as PostgreSQL
    
    C->>SC: POST /subscriptions/buy/:planId
    SC->>SS: purchase(userId, planId)
    
    SS->>DB: Load Plan & User (READ)
    
    rect rgb(230, 255, 230)
        Note over SS,DB: ATOMIC TRANSACTION
        
        SS->>DB: BEGIN TRANSACTION
        
        Note over SS: Step 1: Deactivate old subscription
        SS->>DB: UPDATE subscriptions SET is_active = false
        
        Note over SS: Step 2: Debit wallet
        SS->>WS: debit(userId, price, PURCHASE, manager)
        WS->>DB: SELECT FOR UPDATE (lock balance)
        WS->>DB: INSERT wallet_transaction
        
        Note over SS: Step 3: Create new subscription
        SS->>DB: INSERT subscription
        
        Note over SS: Step 4: Credit referrer (if applicable)
        alt Has Referrer & Reward > 0
            SS->>WS: credit(referrerId, reward, REFERRAL_BONUS)
            WS->>DB: INSERT wallet_transaction
        end
        
        SS->>DB: COMMIT
    end
    
    SS-->>SC: Subscription
    SC-->>C: 201 Created
```

### Withdrawal Flow

```mermaid
flowchart TD
    subgraph "User Request"
        REQ[User requests withdrawal] --> CHECK{Available Balance >= Amount?}
        CHECK --> |No| REJECT1[400 Insufficient Balance]
        CHECK --> |Yes| CREATE[Create PENDING withdrawal]
        CREATE --> WAIT[Wait for Admin]
    end
    
    subgraph "Admin Decision"
        ADMIN[Admin reviews] --> DECIDE{Decision}
        DECIDE --> |Reject| REJECTED[Update status = REJECTED]
        DECIDE --> |Approve| APPROVE{Start Transaction}
    end
    
    subgraph "Atomic Approval"
        APPROVE --> LOCK[Lock withdrawal row]
        LOCK --> VERIFY{Still PENDING?}
        VERIFY --> |No| ROLLBACK[Already processed]
        VERIFY --> |Yes| DEBIT[Debit wallet]
        DEBIT --> UPDATE[Update status = APPROVED]
        UPDATE --> COMMIT[Commit Transaction]
    end
    
    WAIT --> ADMIN
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | ❌ | - | Register new user |
| `POST` | `/api/v1/auth/login` | ❌ | - | Login (returns role) |
| `POST` | `/api/v1/auth/logout` | ✅ | ANY | Logout (clear cookie) |

### Users

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/v1/users/me` | ✅ | ANY | Get current user |
| `PATCH` | `/api/v1/users/me` | ✅ | ANY | Update current user |
| `GET` | `/api/v1/users` | ✅ | ADMIN | List all users (paginated) |
| `GET` | `/api/v1/users/:id` | ✅ | ADMIN | Get user by ID |
| `PATCH` | `/api/v1/users/:id` | ✅ | ADMIN | Update user (inc. role) |

### Wallet

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/v1/wallet/balance` | ✅ | USER | Get my balance |
| `GET` | `/api/v1/wallet/transactions` | ✅ | USER | Get my transactions |
| `GET` | `/api/v1/wallet/all` | ✅ | ADMIN | All transactions (paginated) |
| `GET` | `/api/v1/wallet/balance/:userId` | ✅ | ADMIN | Get user balance |
| `GET` | `/api/v1/wallet/transactions/:userId` | ✅ | ADMIN | Get user transactions |

### Recharges

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/v1/recharges` | ✅ | USER | Request recharge |
| `GET` | `/api/v1/recharges/my` | ✅ | USER | My recharges |
| `GET` | `/api/v1/recharges/pending` | ✅ | ADMIN | Pending recharges |
| `GET` | `/api/v1/recharges` | ✅ | ADMIN | All recharges |
| `PATCH` | `/api/v1/recharges/:id` | ✅ | ADMIN | Approve/Reject |

### Withdrawals

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/v1/withdrawals` | ✅ | USER | Request withdrawal |
| `GET` | `/api/v1/withdrawals/my` | ✅ | USER | My withdrawals |
| `GET` | `/api/v1/withdrawals/pending` | ✅ | ADMIN | Pending withdrawals |
| `GET` | `/api/v1/withdrawals` | ✅ | ADMIN | All withdrawals |
| `PATCH` | `/api/v1/withdrawals/:id` | ✅ | ADMIN | Approve/Reject |

### Plans

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/v1/plans` | ❌ | - | List active plans |
| `GET` | `/api/v1/plans/:id` | ❌ | - | Get plan details |
| `POST` | `/api/v1/plans` | ✅ | ADMIN | Create plan |
| `PATCH` | `/api/v1/plans/:id` | ✅ | ADMIN | Update plan |
| `PATCH` | `/api/v1/plans/:id/activate` | ✅ | ADMIN | Activate plan |
| `PATCH` | `/api/v1/plans/:id/deactivate` | ✅ | ADMIN | Deactivate plan |
| `DELETE` | `/api/v1/plans/:id` | ✅ | ADMIN | Soft delete plan |
| `GET` | `/api/v1/plans/admin/all` | ✅ | ADMIN | All plans (paginated) |

### Subscriptions

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/v1/subscriptions/buy/:planId` | ✅ | USER | Purchase plan |
| `GET` | `/api/v1/subscriptions/me` | ✅ | USER | My active subscription |
| `GET` | `/api/v1/subscriptions` | ✅ | ADMIN | All subscriptions (paginated) |
| `GET` | `/api/v1/subscriptions/daily-returns/my` | ✅ | USER | My daily return logs |
| `GET` | `/api/v1/subscriptions/daily-returns` | ✅ | ADMIN | All daily returns (paginated) |
| `POST` | `/api/v1/subscriptions/daily-returns/trigger` | ✅ | ADMIN | Manually trigger daily returns |

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/v1/dashboard/summary` | ✅ | ADMIN | Dashboard summary metrics |
| `GET` | `/api/v1/dashboard/charts` | ✅ | ADMIN | Chart data for visualizations |

### Schemas

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/v1/schemas` | ❌ | - | List form schema names |
| `GET` | `/api/v1/schemas/:name` | ❌ | - | Get form schema by name |
| `GET` | `/api/v1/schemas/grids` | ❌ | - | List grid schema names |
| `GET` | `/api/v1/schemas/grid/:name` | ❌ | - | Get grid schema by name |

### Health

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/health` | ❌ | - | Application health |
| `GET` | `/health/db` | ❌ | - | Database health |


---

## Request Lifecycle

```mermaid
flowchart TD
    subgraph "Middleware Layer"
        A[Incoming Request] --> B[Helmet - Security Headers]
        B --> C[Cookie Parser]
        C --> D[HTTP Logger Middleware]
    end
    
    subgraph "Guard Layer"
        D --> E{Rate Limiter}
        E --> |Too Many| F[429 Too Many Requests]
        E --> |OK| G{JWT Auth Guard}
        G --> |No Token/Invalid| H[401 Unauthorized]
        G --> |Valid Token| I[Attach user to request]
        I --> J{Roles Guard}
        J --> |Unauthorized| K[403 Forbidden]
        J --> |Authorized| L[Proceed]
    end
    
    subgraph "Pipe Layer"
        L --> M[Validation Pipe]
        M --> |Invalid DTO| N[400 Bad Request]
        M --> |Valid| O[Transform DTO]
        O --> P[ParseUUIDPipe - ID params]
        P --> |Invalid UUID| Q[400 Bad Request]
    end
    
    subgraph "Interceptor Layer"
        P --> R[Audit Interceptor]
        R --> S[Set createdBy/updatedBy]
    end
    
    subgraph "Controller/Service Layer"
        S --> T[Controller Method]
        T --> U[Service Logic]
        U --> V[Repository/Database]
    end
    
    subgraph "Response"
        V --> W[Response Data]
        W --> X[Send Response]
    end
```

---

## Security Implementation

### Defense Layers

```mermaid
flowchart LR
    subgraph "Layer 1: Network"
        A[CORS Whitelist]
        B[Helmet Headers]
    end
    
    subgraph "Layer 2: Rate Limiting"
        C[60 req/min default]
        D[Throttle Guard]
    end
    
    subgraph "Layer 3: Authentication"
        E[JWT Tokens]
        F[HttpOnly Cookies]
        G[Token Expiry]
    end
    
    subgraph "Layer 4: Authorization"
        H[Role-based Access]
        I[Resource Ownership]
    end
    
    subgraph "Layer 5: Validation"
        J[DTO Validation]
        K[UUID Validation]
        L[Whitelist Fields]
    end
    
    subgraph "Layer 6: Data"
        M[Bcrypt Passwords]
        N[Soft Deletes]
        O[Audit Fields]
    end
    
    A --> B --> C --> D --> E --> F --> G --> H --> I --> J --> K --> L --> M --> N --> O
```

### Security Headers (Helmet)

```
Content-Security-Policy: default-src 'self'
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

### Cookie Security

```typescript
{
  httpOnly: true,          // Not accessible via JavaScript
  secure: true,            // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
}
```

---

## CRUD Infrastructure

### Base Classes Hierarchy

```mermaid
classDiagram
    class AuditedEntity {
        +string id
        +string createdBy
        +Date createdAt
        +string updatedBy
        +Date updatedAt
        +boolean deleted
        +string deletedBy
        +Date deletedAt
    }
    
    class BaseRepository~T~ {
        #Repository repository
        #DataSource dataSource
        +findById(id) T
        +findByIdOrFail(id) T
        +findAll(pagination) PaginatedResponse
        +create(data) T
        +update(id, data) T
        +softDelete(id) T
        +runInTransaction(work) R
        +count(where) number
        +exists(where) boolean
    }
    
    class BaseService~T~ {
        #string entityName
        #BaseRepository baseRepository
        +findById(id) T
        +findByIdOrFail(id) T
        +findAll(pagination) PaginatedResponse
        +create(data) T
        +update(id, data) T
        +delete(id) T
        #runInTransaction(work) R
    }
    
    class BaseController~T~ {
        #BaseService service
        +findAll(pagination) PaginatedResponse
        +findById(id) T
        +create(data) T
        +update(id, data) T
        +delete(id) void
    }
    
    AuditedEntity <|-- User
    AuditedEntity <|-- Plan
    AuditedEntity <|-- Subscription
    AuditedEntity <|-- WalletTransaction
    AuditedEntity <|-- Recharge
    AuditedEntity <|-- Withdrawal
    
    BaseRepository <|-- CustomRepository
    BaseService <|-- CustomService
    BaseController <|-- CustomController
```

### Pagination Response Format

All paginated endpoints return:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Deployment Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ❌ | 3000 | Server port |
| `NODE_ENV` | ❌ | development | Environment |
| `DB_HOST` | ✅ | - | PostgreSQL host |
| `DB_PORT` | ❌ | 5432 | PostgreSQL port |
| `DB_USER` | ✅ | - | Database user |
| `DB_PASS` | ✅ | - | Database password |
| `DB_NAME` | ✅ | - | Database name |
| `DB_POOL_SIZE` | ❌ | 20 | Connection pool size |
| `JWT_SECRET` | ✅ | - | JWT signing secret |
| `JWT_EXPIRES_IN` | ❌ | 1d | Token expiration |
| `ALLOWED_ORIGINS` | ❌ | - | CORS whitelist (comma-separated) |
| `THROTTLE_TTL` | ❌ | 60000 | Rate limit window (ms) |
| `THROTTLE_LIMIT` | ❌ | 60 | Requests per window |
| `DAILY_RETURNS_CRON` | ❌ | `0 1 * * *` | Daily returns cron (1 AM) |

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` (no wildcard)
- [ ] Use strong `JWT_SECRET` (32+ chars)
- [ ] Enable HTTPS (Secure cookies require it)
- [ ] Set up database connection pooling
- [ ] Configure rate limiting appropriately
- [ ] Set up structured logging
- [ ] Configure health checks for load balancer
- [ ] Enable graceful shutdown hooks

---

## Summary

This wallet system implements a production-ready financial backend with:

✅ **Atomic Financial Operations** - Database transactions prevent race conditions  
✅ **Role-Based Access Control** - Admin and User roles with proper guards  
✅ **Secure Authentication** - JWT tokens in HttpOnly cookies  
✅ **Comprehensive Validation** - DTO validation and UUID checking  
✅ **Rate Limiting** - Protection against abuse  
✅ **Soft Deletes** - Data preservation with audit trails  
✅ **Reusable CRUD Infrastructure** - Base classes reduce boilerplate  
✅ **Pagination Support** - All list endpoints paginated  
✅ **Health Monitoring** - Database and application health checks  
✅ **Daily Returns** - Automated daily credits for subscribers

---

## Daily Returns System

### Overview

Subscribers automatically receive daily credits based on their plan's `dailyReturn` value.

### Plan Configuration

| Field | Type | Description |
|-------|------|-------------|
| `dailyReturn` | numeric | Amount credited daily to subscriber |

### Daily Returns Flow

```mermaid
flowchart TD
    CRON[Cron Job - 1 AM Daily] --> FIND[Find active subscriptions]
    FIND --> LOOP{For each subscription}
    
    LOOP --> CHECK{Already credited today?}
    CHECK --> |Yes| SKIP[Skip]
    CHECK --> |No| LOAD[Load plan dailyReturn]
    
    LOAD --> ZERO{dailyReturn = 0?}
    ZERO --> |Yes| SKIP
    ZERO --> |No| TX[Start Transaction]
    
    TX --> CREDIT[Credit wallet DAILY_RETURN]
    CREDIT --> LOG[Create DailyReturnLog]
    LOG --> COMMIT[Commit]
    
    SKIP --> NEXT[Next subscription]
    COMMIT --> NEXT
    NEXT --> LOOP
```

### Duplicate Prevention

- `DailyReturnLog` table with unique constraint on `(subscriptionId, creditedForDate)`
- Each credit logged before processing next subscription

### Wallet Transaction Source

Daily returns appear in wallet with source = `DAILY_RETURN`
