# Time-Off Microservice - Example API Requests

## Base URL
`http://localhost:3000`

## Authentication
All requests require the `x-employee-id` header

---

## 1. CREATE TIME-OFF REQUEST

### Request
```bash
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "start_date": "2024-03-15T00:00:00Z",
    "end_date": "2024-03-22T00:00:00Z",
    "reason": "Spring vacation - family trip to Europe",
    "type": "vacation"
  }'
```

### Response
```json
{
  "message": "Time-off request created successfully",
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "employee_id": "emp-john-001",
    "start_date": "2024-03-15T00:00:00.000Z",
    "end_date": "2024-03-22T00:00:00.000Z",
    "reason": "Spring vacation - family trip to Europe",
    "type": "vacation",
    "status": "pending",
    "notes": "",
    "created_at": "2024-01-15T14:32:10.123Z",
    "updated_at": "2024-01-15T14:32:10.123Z"
  }
}
```

---

## 2. LIST ALL TIME-OFF REQUESTS

### Request (without filters)
```bash
curl http://localhost:3000/api/time-off \
  -H "x-employee-id: emp-john-001"
```

### Request (with filters)
```bash
curl "http://localhost:3000/api/time-off?status=pending&type=vacation&start_date=2024-03-01&end_date=2024-04-30" \
  -H "x-employee-id: emp-john-001"
```

### Response
```json
{
  "count": 2,
  "data": [
    {
      "_id": "550e8400-e29b-41d4-a716-446655440001",
      "employee_id": "emp-john-001",
      "start_date": "2024-03-15T00:00:00.000Z",
      "end_date": "2024-03-22T00:00:00.000Z",
      "reason": "Spring vacation - family trip to Europe",
      "type": "vacation",
      "status": "pending",
      "created_at": "2024-01-15T14:32:10.123Z"
    },
    {
      "_id": "550e8400-e29b-41d4-a716-446655440002",
      "employee_id": "emp-john-001",
      "start_date": "2024-04-10T00:00:00.000Z",
      "end_date": "2024-04-11T00:00:00.000Z",
      "reason": "Doctor's appointment - dental checkup",
      "type": "sick_leave",
      "status": "approved",
      "created_at": "2024-01-14T09:15:00.000Z"
    }
  ]
}
```

---

## 3. GET SPECIFIC REQUEST

### Request
```bash
curl http://localhost:3000/api/time-off/550e8400-e29b-41d4-a716-446655440001 \
  -H "x-employee-id: emp-john-001"
```

### Response
```json
{
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "employee_id": "emp-john-001",
    "start_date": "2024-03-15T00:00:00.000Z",
    "end_date": "2024-03-22T00:00:00.000Z",
    "reason": "Spring vacation - family trip to Europe",
    "type": "vacation",
    "status": "pending",
    "notes": "",
    "created_at": "2024-01-15T14:32:10.123Z",
    "updated_at": "2024-01-15T14:32:10.123Z"
  }
}
```

---

## 4. UPDATE REQUEST

### Request - Update Status
```bash
curl -X PUT http://localhost:3000/api/time-off/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "status": "approved",
    "notes": "Approved by HR Manager"
  }'
```

### Request - Update Dates
```bash
curl -X PUT http://localhost:3000/api/time-off/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "start_date": "2024-03-20T00:00:00Z",
    "end_date": "2024-03-27T00:00:00Z"
  }'
```

### Response
```json
{
  "message": "Request updated successfully",
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "employee_id": "emp-john-001",
    "start_date": "2024-03-15T00:00:00.000Z",
    "end_date": "2024-03-22T00:00:00.000Z",
    "reason": "Spring vacation - family trip to Europe",
    "type": "vacation",
    "status": "approved",
    "notes": "Approved by HR Manager",
    "created_at": "2024-01-15T14:32:10.123Z",
    "updated_at": "2024-01-15T15:45:20.456Z"
  }
}
```

---

## 5. DELETE REQUEST

### Request
```bash
curl -X DELETE http://localhost:3000/api/time-off/550e8400-e29b-41d4-a716-446655440001 \
  -H "x-employee-id: emp-john-001"
```

### Response
```json
{
  "success": true,
  "message": "Request deleted successfully"
}
```

---

## 6. ERROR CASES

### Missing Required Field
```bash
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "start_date": "2024-03-15T00:00:00Z",
    "type": "vacation"
  }'
```

Response (400):
```json
{
  "errors": [
    "End date is required",
    "Reason is required"
  ]
}
```

### Conflict Detection
```bash
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "start_date": "2024-03-18T00:00:00Z",
    "end_date": "2024-03-25T00:00:00Z",
    "reason": "Another vacation",
    "type": "vacation"
  }'
```

Response (500):
```json
{
  "error": "Conflict detected: You already have a time-off request from 2024-03-15 to 2024-03-22"
}
```

### Invalid Date Range
```bash
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-john-001" \
  -d '{
    "start_date": "2024-03-22T00:00:00Z",
    "end_date": "2024-03-15T00:00:00Z",
    "reason": "Invalid date range",
    "type": "vacation"
  }'
```

Response (500):
```json
{
  "error": "Start date must be before end date"
}
```

### Missing Authentication Header
```bash
curl http://localhost:3000/api/time-off
```

Response (401):
```json
{
  "error": "Missing x-employee-id header"
}
```

### Request Not Found
```bash
curl http://localhost:3000/api/time-off/invalid-id \
  -H "x-employee-id: emp-john-001"
```

Response (500):
```json
{
  "error": "Request not found"
}
```

### Unauthorized Access
```bash
curl http://localhost:3000/api/time-off/550e8400-e29b-41d4-a716-446655440001 \
  -H "x-employee-id: emp-other-002"
```

Response (500):
```json
{
  "error": "Unauthorized: Cannot access other employee's request"
}
```

---

## 7. TEST SCENARIOS

### Scenario 1: Complete Workflow
```bash
# 1. Employee creates vacation request
REQUEST_ID=$(curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-001" \
  -d '{
    "start_date": "2024-04-01T00:00:00Z",
    "end_date": "2024-04-08T00:00:00Z",
    "reason": "Easter vacation",
    "type": "vacation"
  }' | jq -r '.data._id')

# 2. Manager checks the request
curl http://localhost:3000/api/time-off/$REQUEST_ID \
  -H "x-employee-id: emp-001"

# 3. Employee updates with additional notes
curl -X PUT http://localhost:3000/api/time-off/$REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-001" \
  -d '{
    "notes": "Will hand over work to colleague"
  }'

# 4. Employee lists all requests
curl http://localhost:3000/api/time-off \
  -H "x-employee-id: emp-001"

# 5. Employee deletes the request
curl -X DELETE http://localhost:3000/api/time-off/$REQUEST_ID \
  -H "x-employee-id: emp-001"
```

### Scenario 2: Conflict Prevention
```bash
# Create first vacation
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-002" \
  -d '{
    "start_date": "2024-05-01T00:00:00Z",
    "end_date": "2024-05-15T00:00:00Z",
    "reason": "May vacation",
    "type": "vacation"
  }'

# Try to create overlapping request - will fail
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-002" \
  -d '{
    "start_date": "2024-05-10T00:00:00Z",
    "end_date": "2024-05-20T00:00:00Z",
    "reason": "Extended vacation",
    "type": "vacation"
  }'

# Create non-overlapping request - succeeds
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: emp-002" \
  -d '{
    "start_date": "2024-05-20T00:00:00Z",
    "end_date": "2024-05-25T00:00:00Z",
    "reason": "Extended weekend",
    "type": "vacation"
  }'
```

---

## Health Check

### Request
```bash
curl http://localhost:3000/health
```

### Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:35:00.000Z"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- Request IDs are UUIDs
- Status values: `pending`, `approved`, `rejected`
- Request types: `vacation`, `sick_leave`, `personal`, `unpaid`
- The consumer service processes messages asynchronously
- Conflict detection prevents overlapping time-off for the same employee
- Employee can only manage their own requests
