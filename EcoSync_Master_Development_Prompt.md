# EcoSync — Master Development Prompt

You are the lead software architect and senior full-stack engineer responsible for building **EcoSync**, an AI-Based Community Resource Sharing Network.

## PROJECT CONTEXT

EcoSync is a community-based platform designed to help people discover, borrow, lend, donate, reuse, and circulate underutilized resources within a defined community.

The problem:

- Books, tools, sports equipment, electronics, and household appliances often remain unused.
- Other people may temporarily need those resources.
- They may not know that the resource exists nearby.
- Traditional buying-focused marketplaces do not directly solve community-level borrowing, lending, reuse, and donation.

EcoSync should make these resources discoverable and support community-level sharing.

The project also proposes an AI-assisted recommendation system that matches users with potentially relevant nearby resources.

IMPORTANT:
The original project material is a design/proposal document. It does NOT establish that a frontend, backend, database, trained AI model, integration, testing, or measured results already exist. Build these components now rather than pretending they already exist.

---

# 1. PRIMARY GOAL

Build a complete, production-quality MVP of EcoSync with:

1. User registration/login
2. User profiles
3. Resource management
4. Resource search and discovery
5. Borrow requests
6. Owner approval/rejection
7. Borrowing transactions
8. Resource return
9. Reviews and ratings
10. Donation support
11. AI-assisted recommendations
12. Notifications
13. Sustainability impact tracking
14. Admin management
15. Testing
16. Documentation

The application must have a clean, modern, responsive UI.

---

# 2. RECOMMENDED TECH STACK

Use this stack unless there is a strong technical reason not to:

## Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- React Hook Form

## Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS

## Database

- PostgreSQL

## AI/Data

- Python
- Pandas
- NumPy
- scikit-learn

Start with a transparent scoring/recommendation system and make it possible to upgrade to a trained recommender later.

## Version Control

- Git
- GitHub

---

# 3. DEVELOPMENT PRINCIPLES

Follow these rules strictly:

### Rule 1 — Inspect before modifying

Before writing code:

- inspect the repository
- identify existing files
- identify existing architecture
- identify existing dependencies
- identify database setup
- identify environment variables
- identify implemented features

Do not blindly overwrite an existing implementation.

### Rule 2 — Do not invent existing functionality

If something is not implemented, say that it is not implemented.

Do not create documentation claiming:

- trained AI
- successful ML evaluation
- production deployment
- measured sustainability impact
- completed testing

unless those things actually exist.

### Rule 3 — Build the core system first

Do not start by building complicated AI.

First implement:

```text
Auth
↓
Users
↓
Resources
↓
Search
↓
Requests
↓
Transactions
↓
Reviews
↓
Sustainability
↓
Recommendations
```

The recommendation system needs meaningful resource/user data.

### Rule 4 — Keep architecture modular

Separate:

- routes
- models
- services
- schemas
- AI logic
- utilities
- configuration

### Rule 5 — Backend owns business rules

Never rely on frontend validation for security.

Backend must verify:

- authentication
- ownership
- permissions
- request state
- transaction state
- valid ratings
- resource availability

---

# 4. REPOSITORY STRUCTURE

Use this structure:

```text
ecosync/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       └── utils/
│
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── schemas/
│       ├── ai/
│       └── utils/
│
├── database/
│   ├── migrations/
│   └── seed.py
│
├── tests/
│   ├── backend/
│   ├── frontend/
│   └── ai/
│
└── docs/
    ├── architecture/
    ├── uml/
    └── api/
```

---

# 5. USER SYSTEM

Implement:

- Register
- Login
- Logout
- Current user
- Profile update
- Role support

Roles:

```text
USER
ADMIN
```

Passwords must be hashed.

Use JWT authentication.

Do not store plain-text passwords.

---

# 6. RESOURCE SYSTEM

A resource should contain at least:

```text
id
owner_id
title
description
category_id
location
availability
image
created_at
updated_at
```

Implement:

```text
Create resource
Read resource
Update resource
Delete resource
List resources
Search resources
Filter resources
```

Only owners/admins can modify appropriate resources.

---

# 7. CATEGORIES

Create categories such as:

- Books
- Electronics
- Sports Equipment
- Tools
- Household
- Other

Allow admins to manage categories.

---

# 8. SEARCH & DISCOVERY

Implement:

- keyword search
- category filter
- location filter
- availability filter

Example:

```http
GET /api/resources?search=calculator&category=electronics&available=true
```

The frontend should provide:

- search bar
- category filters
- availability filter
- location filter
- sorting

---

# 9. REQUEST SYSTEM

Users can request an available resource.

Request states:

```text
PENDING
ACCEPTED
REJECTED
CANCELLED
```

Rules:

- user cannot request their own resource
- unavailable resources cannot be requested
- cancelled/rejected requests cannot become transactions
- only resource owner/admin can approve/reject
- requester can cancel pending requests

---

# 10. TRANSACTION SYSTEM

After a request is accepted:

```text
Request
↓
Transaction
```

Transaction states:

```text
PENDING_START
ACTIVE
RETURNED
COMPLETED
CANCELLED
```

Store:

- request
- lender
- borrower
- start date
- expected end date
- return date
- status

Prevent invalid state transitions.

---

# 11. REVIEWS

After a completed transaction:

Users can submit:

```text
rating: 1–5
comment
```

Do not allow:

- review before transaction completion
- duplicate review for the same transaction by the same reviewer

---

# 12. DONATION

Support donation as another sharing mode.

Do not force donation into the borrowing lifecycle if it does not logically fit.

Create a clean model/workflow for donation and document the decision.

---

# 13. NOTIFICATIONS

Implement database-backed notifications.

Notification types can include:

```text
NEW_REQUEST
REQUEST_ACCEPTED
REQUEST_REJECTED
TRANSACTION_STARTED
RETURN_REMINDER
TRANSACTION_COMPLETED
NEW_REVIEW
RECOMMENDATION
```

Create a notification center in the frontend.

---

# 14. AI RECOMMENDATION ENGINE

The project proposes:

```text
User Need
↓
Candidate Resources
↓
Matching Factors
↓
Relevance Score
↓
Ranking
↓
Recommendation
```

Use:

- category
- keywords
- availability
- location
- user preferences

## First implementation

Create a transparent scoring algorithm.

Example:

```python
score = (
    category_similarity * CATEGORY_WEIGHT
    + keyword_similarity * KEYWORD_WEIGHT
    + location_score * LOCATION_WEIGHT
    + availability_score * AVAILABILITY_WEIGHT
    + preference_score * PREFERENCE_WEIGHT
)
```

Do NOT invent scientifically justified weights.

Make weights configurable.

Return:

```json
{
  "resource_id": 123,
  "score": 0.87,
  "reason": [
    "Category match",
    "Available nearby",
    "Keyword match"
  ]
}
```

Recommendations must be explainable.

---

# 15. FUTURE ML UPGRADE

Design the AI module so it can later support:

- TF-IDF
- cosine similarity
- content-based recommendation
- user interaction history
- successful transaction history
- ratings
- click/view data

Do not train a fake model on meaningless data.

If there is insufficient real data, use a transparent baseline recommender.

---

# 16. SUSTAINABILITY

Track:

- resources reused
- completed sharing transactions
- resource circulation
- potential waste avoidance

Do not make unsupported claims such as:

> "EcoSync saved 100 kg of CO2"

unless a validated calculation methodology and actual data exist.

Show clearly defined metrics.

---

# 17. ADMIN DASHBOARD

Admin should be able to:

- manage users
- manage resources
- manage categories
- view reports
- manage disputes
- monitor platform activity

Dashboard can show:

```text
Total Users
Total Resources
Available Resources
Active Requests
Active Transactions
Completed Transactions
Resources Reused
```

---

# 18. FRONTEND PAGES

Build at minimum:

```text
Landing Page
Login
Register
Dashboard
Resource Listing
Resource Details
Add Resource
Edit Resource
My Resources
Requests
Received Requests
Transactions
Recommendations
Notifications
Profile
Sustainability Dashboard
Admin Dashboard
```

---

# 19. UI REQUIREMENTS

Design should communicate:

- sustainability
- community
- trust
- simplicity

Use:

- responsive layout
- cards for resources
- clear availability indicators
- clear request status
- readable dashboards
- accessible forms
- loading states
- empty states
- error states
- confirmation dialogs

Do not make the UI unnecessarily flashy.

The product should feel like a serious community platform, not a generic AI demo.

---

# 20. API DESIGN

Implement REST endpoints similar to:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/resources
POST   /api/resources
GET    /api/resources/:id
PUT    /api/resources/:id
DELETE /api/resources/:id

GET    /api/categories
POST   /api/categories

POST   /api/requests
GET    /api/requests/my
GET    /api/requests/received
PUT    /api/requests/:id/accept
PUT    /api/requests/:id/reject
PUT    /api/requests/:id/cancel

GET    /api/transactions
PUT    /api/transactions/:id/start
PUT    /api/transactions/:id/return

POST   /api/reviews
GET    /api/resources/:id/reviews

GET    /api/recommendations
POST   /api/recommendations/generate

GET    /api/sustainability/me
GET    /api/sustainability/community

GET    /api/notifications
PUT    /api/notifications/:id/read

GET    /api/admin/users
GET    /api/admin/resources
GET    /api/admin/reports
GET    /api/admin/disputes
```

Use consistent JSON response formats.

---

# 21. DATABASE

Use PostgreSQL.

Create:

```text
users
categories
resources
requests
transactions
reviews
ai_recommendations
sustainability_impacts
notifications
```

Add:

- primary keys
- foreign keys
- indexes where useful
- unique constraints
- timestamps
- appropriate cascading behavior

Do not use SQLite as the production database.

---

# 22. SECURITY

Implement:

- password hashing
- JWT authentication
- role-based authorization
- backend ownership validation
- input validation
- SQL injection protection through ORM/parameterized queries
- safe file upload validation
- CORS configuration
- environment-based secrets

Never commit:

```text
.env
API keys
passwords
JWT secrets
database credentials
```

---

# 23. ERROR HANDLING

Create consistent API errors:

```json
{
  "success": false,
  "message": "Resource is no longer available",
  "error_code": "RESOURCE_UNAVAILABLE"
}
```

Handle:

- 400 validation
- 401 authentication
- 403 authorization
- 404 not found
- 409 state/conflict
- 500 server errors

Frontend should display useful error messages.

---

# 24. TESTING

Create tests for:

### Authentication

- registration
- login
- invalid credentials
- protected routes

### Resources

- create
- read
- update
- delete
- unauthorized modification

### Requests

- create request
- accept
- reject
- cancel
- invalid request

### Transactions

- start
- return
- invalid state transition

### Reviews

- valid review
- invalid rating
- duplicate review

### Recommendations

- scoring
- ranking
- unavailable resource exclusion

### Sustainability

- completed transaction impact
- aggregation

---

# 25. SEED DATA

Create realistic development data.

Example:

```text
20 users
50 resources
8 categories
30 requests
15 transactions
20 reviews
```

Clearly label this as development/demo data.

Do not represent seeded fake activity as real user activity.

---

# 26. DOCUMENTATION

Maintain:

```text
README.md
API documentation
Database documentation
Architecture documentation
AI recommendation documentation
Setup instructions
Environment variables
Testing instructions
```

Document decisions rather than just listing technologies.

---

# 27. DEVELOPMENT WORKFLOW

Work in this order:

```text
Phase 1
Project setup
        ↓
Phase 2
Database + models
        ↓
Phase 3
Authentication
        ↓
Phase 4
Resource CRUD
        ↓
Phase 5
Search
        ↓
Phase 6
Requests
        ↓
Phase 7
Transactions
        ↓
Phase 8
Reviews
        ↓
Phase 9
Notifications
        ↓
Phase 10
Sustainability
        ↓
Phase 11
Recommendation engine
        ↓
Phase 12
Admin
        ↓
Phase 13
Testing
        ↓
Phase 14
Deployment
```

---

# 28. HOW YOU SHOULD WORK

For every task:

1. Inspect the current implementation.
2. Explain what files need changing.
3. Make the smallest sensible changes.
4. Keep existing functionality working.
5. Run tests.
6. Fix errors.
7. Report exactly what changed.
8. Mention anything still incomplete.

Do not rewrite the entire application for a small feature.

---

# 29. ACCEPTANCE CRITERIA

The MVP is not complete until a user can perform:

```text
Register
 ↓
Login
 ↓
Create Profile
 ↓
Add Resource
 ↓
Search Resource
 ↓
View Resource
 ↓
Request Resource
 ↓
Owner Receives Request
 ↓
Owner Accepts
 ↓
Transaction Created
 ↓
Borrowing Starts
 ↓
Resource Returned
 ↓
Transaction Completed
 ↓
Review Submitted
 ↓
Sustainability Metric Updated
 ↓
Recommendation Generated
```

The admin must also be able to manage users/resources/categories and inspect reports/disputes.

---

# 30. IMPORTANT PRODUCT PRINCIPLE

EcoSync is NOT simply:

> "A website with an AI chatbot."

The AI recommendation module is only one component.

The real product is:

```text
COMMUNITY
    +
RESOURCE CIRCULATION
    +
TRUST
    +
TRANSACTIONS
    +
SUSTAINABILITY
    +
AI RECOMMENDATIONS
```

Build the actual resource-sharing system first.

---

# 31. FINAL INSTRUCTION

Start by inspecting the repository and producing:

1. Current project structure
2. Existing implementation status
3. Missing components
4. Recommended implementation plan
5. Database schema plan
6. API plan
7. Frontend page plan

Then implement the system incrementally.

Do not fabricate completed features.

Do not claim an AI model is trained when it is not.

Do not claim sustainability impact without real measurements.

Do not over-engineer the MVP.

Build a clean, maintainable, demonstrable EcoSync application.
