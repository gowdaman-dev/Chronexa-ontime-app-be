# Chronexa Mobile API Backend

NestJS monorepo powering the Chronexa Mobile application backend — a microservices architecture with NATS transport, Redis caching, and RBAC authentication.

## Architecture

```
┌─────────────┐     NATS      ┌───────────────┐
│   Gateway   │ ◄──────────► │  auth-service  │
│  (REST API) │               │ (JWT, AD Auth) │
└──────┬──────┘               └───────────────┘
       │                           ┌───────────────┐
       │         NATS              │  user-service  │
       └─────────────────────────► │ (Users/Emps)   │
                                   └───────┬───────┘
                                           │
                              ┌────────────▼───────────┐
                              │       SQL Server        │
                              │  (Chronexa DB)          │
                              └────────────────────────┘
```

- **Gateway** — Public-facing REST API (port 3000). Validates auth, proxies requests to microservices via NATS.
- **auth-service** — Authentication: local login, Azure AD login, JWT issuance/validation, token blacklisting.
- **user-service** — User & employee CRUD operations with Prisma ORM against SQL Server.

## Project Structure

```
apps/
├── gateway/                        # REST API Gateway
│   └── src/
│       ├── auth-service/           # Auth NATS client + controller
│       ├── user-service/           # User NATS client + controller
│       ├── employee-service/       # Employee NATS client + controller
│       └── common/filters/         # Global exception filters
├── auth-service/                   # Auth microservice (NATS listener)
│   └── src/
│       ├── auth-service.service.ts # Login, AD login, token logic
│       └── auth-service.controller.ts  # NATS message handlers
└── user-service/                   # User/Employee microservice (NATS listener)
    └── src/
        ├── user-service.service.ts # Prisma CRUD operations
        └── user-service.controller.ts  # NATS message handlers

libs/
├── auth/                           # Auth guards, RBAC, decorators
│   └── src/
│       ├── guards/                 # AuthGuard, RbacGuard, EmployeeTypeGuard
│       ├── decorators/             # @Roles, @Public, @CurrentUser, @EmployeeType
│       └── interfaces/             # AuthUser, IAuthService contracts
├── dto/                            # Shared DTOs + Swagger doc decorators
│   └── src/
│       ├── *.dto.ts                # Validation DTOs (class-validator)
│       └── *.doc.ts                # Swagger decorators (applyDecorators)
├── redis/                          # Redis caching layer
│   └── src/
│       ├── redis.service.ts        # ioredis client wrapper
│       └── cache.service.ts        # Higher-level cache with namespaced keys/TTLs
├── prisma/                         # PrismaService (extends PrismaClient)
├── config/                         # ConfigModule (env vars)
├── common/                         # Audit interceptor, shared modules
└── database/                       # Database utilities
```

## Authentication & Authorization

### Flow

```
Request → AuthGuard → RbacGuard → EmployeeTypeGuard → Controller
```

All three guards are registered **globally** as `APP_GUARD`. Guards with no metadata on a handler pass through silently.

| Guard | Bypass | Purpose |
|---|---|---|
| `AuthGuard` | `@Public()` | Extracts Bearer token, validates via NATS `auth.validate_token`, attaches `AuthUser` to `request.user` |
| `RbacGuard` | No `@Roles()` | Checks `request.user.role` against required roles |
| `EmployeeTypeGuard` | No `@EmployeeType()` | Checks `request.user.employeeType` against required type |

### Role Derivation

Role is computed from `employee_master.manager_flag`:
- `manager_flag = true` → **Manager**
- else → **Employee**

### Employee Type

Computed from `employee_master.employee_type_id`:
- `employee_type_id = 26` → **Technical**
- else → **Professional**

### JWT Payload

```json
{
  "sub": 100,
  "userId": 1,
  "role": "Manager",
  "employeeType": "Professional",
  "employeeId": 100,
  "login": "user@chronexa.ai",
  "isADUser": false
}
```

### Auth Decorators

```typescript
@Public()                              // Skip auth entirely
@Roles('Manager')                      // Require Manager role
@EmployeeType('Technical')            // Require Technical employee type
@CurrentUser() user: AuthUser         // Inject authenticated user
@CurrentUser('role') role: string     // Inject specific field
```

## API Endpoints

### Authentication (`/v1/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | Local login with login/password |
| POST | `/ad-login` | Public | Azure AD login with AD token |
| POST | `/logout` | Public | Invalidate refresh token |

### Users (`/v1/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Paginated list (`?limit=20&offset=0`) |
| GET | `/:id` | Authenticated | Get by ID |
| POST | `/` | Manager only | Create user |
| PATCH | `/:id` | Manager only | Update user |
| DELETE | `/:id` | Manager only | Delete user |

### Employees (`/v1/employees`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Paginated list (`?limit=20&offset=0`) |
| GET | `/:id` | Authenticated | Get by ID |
| POST | `/` | Manager only | Create employee |
| PATCH | `/:id` | Manager only | Update employee |
| DELETE | `/:id` | Manager only | Delete employee |

All list endpoints return:
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "hasNext": true
}
```

## Redis Caching

`RedisService` provides the ioredis client. `CacheService` provides structured caching with namespaced keys.

### Cache Keys & TTLs

| Key Pattern | TTL | Purpose |
|---|---|---|
| `auth:session:{token}` | 24h | Cached JWT payload for fast validation |
| `auth:blacklist:{jti}` | 24h | Blacklisted token IDs (logout) |
| `auth:ad_token:{sha256}` | 5m | Cached Graph API validation result |
| `users:list` | 30m | Full user list (paginated from cache) |
| `employees:list` | 30m | Full employee list (paginated from cache) |

### Cache Invalidation

- `users:list` is deleted on user create/update/delete
- `employees:list` is deleted on employee create/update/delete

### `getOrSet` Pattern

```typescript
const data = await this.cache.getOrSet('users:list', () =>
  this.prisma.sec_users.findMany({ ... }),
  1800,
);
```

## DTO & Documentation Pattern

DTOs are split into two files per domain:
- `*.dto.ts` — Class definitions with `class-validator` decorators (validation)
- `*.doc.ts` — Swagger decorators using `applyDecorators()` (documentation)

```typescript
// auth.doc.ts
export function ApiLoginProperty() {
  return applyDecorators(
    ApiProperty({ example: 'john.doe', description: 'User login name' }),
  );
}

// auth.dto.ts
export class LoginDto {
  @ApiLoginProperty()
  @IsString()
  @IsNotEmpty()
  login!: string;
}
```

## Prisma

`PrismaService` extends `PrismaClient` with lifecycle hooks (`onModuleInit`/`onModuleDestroy`). Models use **snake_case** names matching the SQL Server schema (e.g., `sec_users`, `employee_master`, `user_tokens`).

## Setup

### Prerequisites

- Node.js >= 20
- NATS server running
- SQL Server instance (Chronexa DB)
- Redis server

### Environment Variables (`.env`)

```env
DATABASE_URL="sqlserver://host;user=user;password=pass;database=Chronexa;TrustServerCertificate=true"
REDIS_URL="redis://localhost:6379"
natsUrl="nats://localhost:4222"
accessTokenSecret="your-jwt-secret"
PORT=3000
TENANT_ID="azure-tenant-id"       # For AD login
CLIENT_ID="azure-client-id"       # For AD login
CLIENT_SECRET="azure-secret"      # For AD login
```

### Install & Run

```bash
# Install
npm install

# Generate Prisma client
npx prisma generate

# Build all services
npx nest build gateway
npx nest build auth-service
npx nest build user-service

# Run (separate terminals)
npx nest start auth-service
npx nest start user-service
npx nest start gateway

# API docs available at http://localhost:3000/docs
```

### NATS Message Patterns

| Pattern | Source | Target |
|---|---|---|
| `auth.login` | Gateway | auth-service |
| `auth.ad_login` | Gateway | auth-service |
| `auth.logout` | Gateway | auth-service |
| `auth.validate_token` | Gateway (AuthGuard) | auth-service |
| `user.get_all` | Gateway | user-service |
| `user.get_by_id` | Gateway | user-service |
| `user.create` | Gateway | user-service |
| `user.update` | Gateway | user-service |
| `user.delete` | Gateway | user-service |
| `employee.get_all` | Gateway | user-service |
| `employee.get_by_id` | Gateway | user-service |
| `employee.create` | Gateway | user-service |
| `employee.update` | Gateway | user-service |
| `employee.delete` | Gateway | user-service |
