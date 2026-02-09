# API Response Standard

This document defines the standard response format for all API endpoints in TheHealthApp.

## Response Format

All API responses follow a consistent JSON structure with a `success` boolean and either `data` or `error` field.

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload here
  }
}
```

**Example - User Login:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "name": "John Doe",
      "age": 25,
      "gender": "male",
      "phone": "1234567890",
      "photo_url": null
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional context
  }
}
```

**Example - Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error in field 'age': value is not a valid integer",
    "details": [
      {
        "loc": ["body", "age"],
        "msg": "value is not a valid integer",
        "type": "type_error.integer"
      }
    ]
  }
}
```

## HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | Successful GET, PATCH, POST (with body) |
| 201 | Resource created (optional, 200 also acceptable) |
| 204 | Successful DELETE or POST with no response body |
| 400 | Bad request / malformed input |
| 401 | Unauthorized / invalid credentials |
| 403 | Forbidden / insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate username) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Error Codes

Standard error codes used in the `error.code` field:

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `HTTP_ERROR` | General HTTP error |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Access denied |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (duplicates) |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Backend Implementation

Use the `SuccessResponse` wrapper for all successful responses:

```python
from .models import SuccessResponse, UserResponse

@app.get("/api/v1/users/me", response_model=SuccessResponse[UserResponse])
async def get_own_profile(current_user: User):
    return SuccessResponse(data=current_user)
```

Errors are automatically wrapped by the exception handlers in `main.py`.

## Frontend Handling

The API client automatically unwraps successful responses:

```javascript
// client.js response interceptor extracts response.data.data
const user = await authService.getCurrentUser();
// user is already the unwrapped data, not { success: true, data: {...} }
```

Error responses are mapped through `errorMapper.js`:

```javascript
// Error structure after mapping
{
  messageKey: 'errors.invalidCredentials',  // i18n key
  message: 'Incorrect username or password', // Backend message
  status: 401,
  details: { ... }  // Optional
}
```

## Adding New Endpoints

1. Define response schema in `models.py`
2. Use `SuccessResponse[YourSchema]` as the response_model
3. Return `SuccessResponse(data=your_data)`
4. Add any new error codes to `errorMapper.js` if needed
