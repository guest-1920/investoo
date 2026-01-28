# Common Module Documentation

## Overview
The **Common Module** (`src/common`) serves as the backbone of the application's shared architecture. It contains reusable logic, base classes, and utilities that ensure consistency across all feature modules (Users, Wallet, Plans, etc.).

By centralizing these components, the application adheres to the **DRY (Don't Repeat Yourself)** principle and maintains uniform behavior for things like auditing, response formatting, and data transformation.

## 📂 Directory Structure

```text
src/common/
├── dto/             # Shared Data Transfer Objects (Validation)
├── entities/        # Base Database Entities
├── interceptors/    # Request/Response processing pipelines
├── middleware/      # HTTP Request logging/processing
├── transformers/    # TypeORM Data Transformers
└── controllers/     # (Optional) specific shared endpoints
```

## 🧩 Key Components

### 1. Entities (`/entities`)
**`AuditedEntity`**
This is the abstract base class for almost all database tables. It automates the tracking of record lifecycles.
- **`id`**: Generates a UUID v4 primary key.
- **Timestamps**: Automatically sets `createdAt` and `updatedAt`.
- **Soft Delete**: Adds `deletedAt` and `deleted` flag (records are hidden, not removed).
- **User Audit**: Tracks `createdBy` and `updatedBy` (requires `AuditInterceptor`).

### 2. DTOs (`/dto`)
**`PaginationDto`**
Standardizes how API clients request lists of data.
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Column to sort by (default: 'createdAt')
- `sortOrder`: 'ASC' or 'DESC'

**`PaginatedResponseDto`**
Standardizes the structure of list responses, wrapping the data with metadata.
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Interceptors (`/interceptors`)
**`AuditInterceptor`**
Automates the population of `createdBy` and `updatedBy` fields.
- Intercepts incoming HTTP requests.
- Extract the authenticated user from `req.user`.
- Injects the User ID into the request body before it reaches the Controller/Service.

### 4. Transformers (`/transformers`)
**`DecimalTransformer`**
Critical for financial accuracy.
- **Problem**: PostgreSQL returns generic numeric types as *strings* to avoid precision loss, but JavaScript needs *numbers* for calculation.
- **Solution**: This transformer converts the database string back to a JavaScript `number` (float) when reading, and ensures safe storage when writing.

### 5. Middleware (`/middleware`)
**`HttpLoggerMiddleware`**
Provides observability by logging every HTTP request to the console.
- Format: `[HTTP] METHOD /url STATUS_CODE - DURATIONms`
- Helps in debugging latency and tracking traffic flow.

## 💡 How to Use
When creating a new feature (e.g., `Products`), you should:
1. Extend `AuditedEntity` in your `Product` entity.
2. Use `PaginationDto` in your `findAll` controller method.
3. Use `DecimalTransformer` for any price/cost columns.
4. Ensure `AuditInterceptor` is running (usually global) to track who created the product.
