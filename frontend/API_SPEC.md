TARA Agent Hub – Backend API Specification
Version: 1.1
Audience: Backend Developers
Purpose: Define all API endpoints required by the TARA Agent Hub frontend, including authentication, dashboards, CRM, quotes, trips, AI planning, and agent management.

1. Authentication APIs
Handles user authentication and session management.

1.1 Login
- Endpoint: `/auth/login/`
- Method: POST
- Authentication: Public
Request Body:
```json
{
  "username": "string",
  "password": "string"
}
```
Response:
```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": 0,
    "username": "string",
    "email": "string",
    "role": "Agency Agent | Agency Admin"
  }
}
```

1.2 Logout
- Endpoint: `/auth/logout/`
- Method: POST
- Authentication: Required
Request Body:
```json
{
  "refresh": "string"
}
```

2. Dashboard & Analytics (Modular)
Provides real-time analytics and operational insights. Each component is modular for low-latency integration.

2.1 Stats Cards
- Endpoint: `/agency/user-dashboard-stats/` (Agent) | `/agency/dashboard-stats/` (Admin)
- Method: GET
- Role: Agent | Admin
Response (Agent):
```json
{
  "total_quotes": { "value": 0, "growth": "+0%" },
  "new_clients_this_month": { "value": 0, "growth": "+0%" },
  "confirmed_bookings": { "value": 0, "growth": "+0%" },
  "conversion_rate": { "value": "0%", "growth": "+0%" },
  "average_yield": { "value": "$0", "growth": "+0%" }
}
```
Response (Admin):
```json
{
  "total_bookings": 0,
  "bookings_growth": 0,
  "clients_contacted": 0,
  "clients_growth": 0,
  "quote_conversion": 0,
  "conversion_growth": 0,
  "total_revenue": 0,
  "revenue_growth": 0,
  "currency": "USD"
}
```

2.2 Upcoming Departures
- Endpoint: `/agency/upcoming-departures/`
- Method: GET, PATCH
Response (GET):
```json
{
  "total": 0,
  "urgent_count": 0,
  "upcoming_departures": [
    {
      "id": 0,
      "client_name": "string",
      "destination": "string",
      "origin": "string",
      "carrier": "string",
      "travel_date": "YYYY-MM-DD",
      "departure_time": "HH:MM",
      "is_urgent": true,
      "urgency": "High | Medium | Low"
    }
  ]
}
```
Request Body (PATCH):
```json
{
  "is_acknowledged": true
}
```

2.3 Todo List
- Endpoint: `/agency/todo-list/`
- Method: GET, POST, PATCH, DELETE
Response (GET):
```json
{
  "results": [
    {
      "id": "string",
      "task_title": "string",
      "client_name": "string",
      "task_category": "Pricing | Payment | Departure",
      "priority": "HIGH | MEDIUM | LOW",
      "progress_percentage": 0,
      "due_date": "ISO Date",
      "next_action": "string"
    }
  ]
}
```
Request Body (POST/PATCH):
```json
{
  "task_title": "string",
  "client_name": "string",
  "task_category": "string",
  "priority": "string",
  "progress_percentage": 0,
  "due_date": "ISO Date"
}
```

2.4 Revenue Overview Chart
- Endpoint: `/agency/revenue-overview/`
- Method: GET
Response:
```json
{
  "date_labels": ["Jan", "Feb", "Mar"],
  "revenue_values": [1000, 2000, 1500]
}
```

2.5 Booking Heatmap
- Endpoint: `/trips/map-data/`
- Method: GET
Response:
```json
{
  "locations": [
    {
      "lat": 0.0,
      "lon": 0.0,
      "city": "string",
      "country": "string",
      "booking_count": 0,
      "total_value": 0,
      "sample_trips": []
    }
  ]
}
```

2.6 Top Destinations
- Endpoint: `/agency/top-destinations/`
- Method: GET
Response:
```json
{
  "top_destinations": [
    {
      "destination": "string",
      "booked_trips": 0
    }
  ]
}
```

2.7 Recent Activity
- Endpoint: `/clients/activity-logs/`
- Method: GET, DELETE
Response (GET):
```json
[
  {
    "id": 0,
    "user_name": "string",
    "description": "string",
    "client_name": "string",
    "created_at": "ISO Date"
  }
]
```

2.8 Travel Suggestions
- Endpoint: `/destination-suggestions/`
- Method: GET
Response:
```json
{
  "months": []
}
```

2.9 Top Performers (Admin Only)
- Endpoint: `/agency/top-performers/`
- Method: GET
Response:
```json
{
  "results": [
    {
      "id": 0,
      "name": "string",
      "revenue": 0,
      "bookings": 0,
      "growth": "+0%"
    }
  ]
}
```

3. Quotes & Trips
Handles quote lifecycle and itinerary management.

3.1 Detailed Quote View
- Endpoint: `/clients/quotes/{id}/detailed/`
- Method: GET
Response:
```json
{
  "quote": {
    "id": 0,
    "grand_total": "0.00",
    "status": "draft",
    "version_number": 1,
    "trip_id": 0
  },
  "client": {
    "name": "string"
  },
  "flights": [],
  "hotels": [],
  "activities": [],
  "itinerary_days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "string",
      "activities": []
    }
  ]
}
```

3.2 Update Trip (Full Save)
- Endpoint: `/trips/{id}/update/`
- Method: PATCH
Request Body:
```json
{
  "quote": {
    "items": []
  },
  "itinerary": {
    "days": []
  }
}
```

4. Clients & CRM
Client management and activity tracking.

4.1 CRM Overview
- Endpoint: `/clients/crm-overview/`
- Method: GET
Response:
```json
{
  "total_clients": 0,
  "total_clients_growth": "+0%",
  "new_clients": 0,
  "high_value_clients": 0,
  "recent_activity": []
}
```

4.2 Create Client
- Endpoint: `/clients/`
- Method: POST
Request Body:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "date_of_birth": "YYYY-MM-DD",
  "notes": "string",
  "budget_range": "string",
  "origin": "string",
  "destination": "string",
  "travel_date": "YYYY-MM-DD",
  "client_type": "string | number",
  "travel_style": "string | number",
  "group_members": [
    {
      "name": "string",
      "type": "adult | child",
      "relation": "string"
    }
  ]
}
```
Response:
```json
{
  "id": 0,
  "name": "string",
  "email": "string",
  "phone": "string",
  "created_at": "ISO Date",
  "updated_at": "ISO Date"
}
```

4.3 Update Client
- Endpoint: `/clients/{id}/`
- Method: PATCH
Request Body: Partial of Create Client Body.
Response: Updated Client Object.

4.4 Delete Client
- Endpoint: `/clients/{id}/`
- Method: DELETE
Response: 204 No Content.

4.5 Client Details
- Endpoint: `/clients/{id}/`
- Method: GET
Response:
```json
{
  "id": 0,
  "name": "string",
  "email": "string",
  "phone": "string",
  "origin": "string",
  "tags": [],
  "group_memberships": [],
  "loyalty_memberships": []
}
```

5. Quote Assistant (AI)
AI-driven trip planning and search.

5.1 Generate Travel Plan
- Endpoint: `/plan/`
- Method: POST
Request Body:
```json
{
  "message": "string",
  "session_id": 0
}
```
Response:
```json
{
  "plan": "string",
  "session_id": 0,
  "from_airport": "string",
  "to_airport": "string"
}
```

5.2 Flight Search
- Endpoint: `/flights/`
- Method: POST
Request Body:
```json
{
  "from_airport": "string",
  "to_airport": "string",
  "depart_date": "YYYY-MM-DD",
  "return_date": "YYYY-MM-DD"
}
```

6. Agent Management (Admin Only)
Manage agency agents and commissions.

6.1 Get Agents
- Endpoint: `/agency/agents/`
- Method: GET
Response:
```json
{
  "results": [
    {
      "id": 0,
      "name": "string",
      "email": "string",
      "phone": "string",
      "location": "string",
      "is_active": true,
      "commission": 0,
      "created_at": "ISO Date"
    }
  ]
}
```

6.2 Create Agent
- Endpoint: `/agency/agents/`
- Method: POST
Request Body:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "commission": 0,
  "access_permissions": {}
}
```

6.3 Update Agent Status
- Endpoint: `/agency/agents/status/{id}/`
- Method: POST
Request Body:
```json
{
  "is_active": true
}
```

6.4 Set Commission
- Endpoint: `/agency/agents/set-commission/{id}/`
- Method: POST
Request Body:
```json
{
  "commission_rate": 0
}
```

Notes for Backend Implementation
- All protected routes require JWT access token
- Admin-only routes must enforce role-based permissions
- Dates must follow ISO 8601
- Monetary values should support multi-currency
- Pagination recommended for all list endpoints
