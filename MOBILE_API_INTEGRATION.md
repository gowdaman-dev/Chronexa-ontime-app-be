# Mobile API Integration Quick Guide

Base URL for local testing:

```text
http://localhost:8122/v1
```

For deployed environments, replace the host and keep the `/v1` prefix.

## Common Headers

For all protected mobile APIs:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
app-version: <mobile-app-version>
User-Agent: <mobile-user-agent>
```

For IDS face APIs, use `multipart/form-data` instead of JSON.

## Authentication

### Login

```http
POST /auth/login
```

Request:

```json
{
  "login": "employee-login",
  "password": "employee-password"
}
```

Response includes:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "employeeNumber": 123,
    "subjectId": "EMP001",
    "role": "EMPLOYEE",
    "isGeofence": true,
    "lastTransaction": null
  }
}
```

Use `accessToken` as `Authorization: Bearer <accessToken>` for the APIs below.

### Azure AD Login

```http
POST /auth/ad-login
```

Request:

```json
{
  "adToken": "<microsoft-access-token>"
}
```

## Check-In / Check-Out APIs

### Get Today Check-In and Check-Out

```http
GET /mobile/transactions/my-check-in-out
```

Purpose: returns today's current employee check-in and check-out state.

Example:

```bash
curl -X GET "http://localhost:8122/v1/mobile/transactions/my-check-in-out" \
  -H "Authorization: Bearer <accessToken>"
```

### Get Last Transactions

```http
GET /mobile/transactions/last-transactions
```

Purpose: returns recent attendance transactions for the current employee.

Example:

```bash
curl -X GET "http://localhost:8122/v1/mobile/transactions/last-transactions" \
  -H "Authorization: Bearer <accessToken>"
```

## Map / Geofence APIs

### Get My Work Location

```http
GET /mobile/location/my-work-location
```

Purpose: returns the current employee's assigned work location.

Example:

```bash
curl -X GET "http://localhost:8122/v1/mobile/location/my-work-location" \
  -H "Authorization: Bearer <accessToken>"
```

### Verify Assigned Location

```http
POST /mobile/location/verify-assigned-location
```

Purpose: checks if the supplied coordinates are inside the authenticated employee's assigned work location.

Request:

```json
{
  "coordinates": [25.2048, 55.2708]
}
```

Example:

```bash
curl -X POST "http://localhost:8122/v1/mobile/location/verify-assigned-location" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"coordinates\":[25.2048,55.2708]}"
```

### Verify Any Configured Location

```http
POST /mobile/location/verify-location
```

Purpose: checks if supplied coordinates are inside any configured work location.

Request:

```json
{
  "coordinates": [25.2048, 55.2708]
}
```

### Spark Today Location

```http
GET /org/spark/todayLocation
```

Purpose: returns today's Spark location data for the current employee.

Example:

```bash
curl -X GET "http://localhost:8122/v1/org/spark/todayLocation" \
  -H "Authorization: Bearer <accessToken>"
```

## Face Deduction / IDS APIs

These endpoints require an image upload using `multipart/form-data`.

### IDS Punch

```http
POST /ids-punch/punch
```

Purpose: verifies the face image with IDS and creates an attendance transaction.

Form fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `image` | file | yes | Face image |
| `reason` | string | yes | Usually `IN` or `OUT` |
| `geolocation` | string | yes | Example: `25.2048,55.2708` |
| `user_entry_flag` | string boolean | no | Example: `true` |
| `device_id` | string | no | Mobile device identifier |

Example:

```bash
curl -X POST "http://localhost:8122/v1/ids-punch/punch" \
  -H "Authorization: Bearer <accessToken>" \
  -H "app-version: 1.0.0" \
  -F "image=@face.jpg" \
  -F "reason=IN" \
  -F "geolocation=25.2048,55.2708" \
  -F "user_entry_flag=true" \
  -F "device_id=mobile-001"
```

### IDS Verify Encounter

```http
POST /ids-punch/verify-encounter
```

Purpose: verifies an uploaded face image against a provided IDS subject.

Form fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `image` | file | yes | Face image |
| `subjectId` | string | yes | IDS subject identifier |
| `reason` | string | yes | Usually `IN` or `OUT` |
| `geolocation` | string | yes | Example: `25.2048,55.2708` |
| `user_entry_flag` | string boolean | no | Example: `true` |
| `device_id` | string | no | Mobile device identifier |

Example:

```bash
curl -X POST "http://localhost:8122/v1/ids-punch/verify-encounter" \
  -H "Authorization: Bearer <accessToken>" \
  -H "app-version: 1.0.0" \
  -F "image=@face.jpg" \
  -F "subjectId=EMP001" \
  -F "reason=IN" \
  -F "geolocation=25.2048,55.2708"
```

## Recommended Mobile Flow

1. Call `/auth/login` or `/auth/ad-login`.
2. Store the returned `accessToken` securely.
3. Call `/mobile/location/my-work-location`.
4. Use device GPS and call `/mobile/location/verify-assigned-location`.
5. If location is valid, call `/ids-punch/punch` with the face image.
6. Refresh UI using `/mobile/transactions/my-check-in-out` and `/mobile/transactions/last-transactions`.

## Notes

- All coordinates use `[latitude, longitude]`.
- `geolocation` in IDS requests is a string: `"latitude,longitude"`.
- Do not log or expose `accessToken` in mobile logs, screenshots, or reports.
- Swagger/Scalar docs are available locally at `/docs` when the gateway is running.
