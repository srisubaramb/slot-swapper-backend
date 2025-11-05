# SlotSwapper Backend

This is the backend API for SlotSwapper, a peer-to-peer time-slot scheduling application. It provides RESTful endpoints for user authentication, event management, and swap logic.

## Overview

The backend is built with Node.js, Express.js, and MongoDB. It handles user authentication with JWT, CRUD operations for events, and the core swap functionality that allows users to exchange time slots.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Enabled for cross-origin requests

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/srisubaramb/slot-swapper-backend.git
   cd slot-swapper-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```
   MONGO_URI=mongodb+srv://your-username:your-password@cluster0.fdnqcss.mongodb.net/your-database?appName=Cluster0
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   The server will run on http://localhost:5000

## API Endpoints

### Authentication

- `POST /api/auth/signup`

  - **Description**: Register a new user
  - **Body**: `{ "name": "string", "email": "string", "password": "string" }`
  - **Response**: `{ "message": "User created" }`

- `POST /api/auth/login`
  - **Description**: Authenticate user and get JWT token
  - **Body**: `{ "email": "string", "password": "string" }`
  - **Response**: `{ "token": "jwt_token_string" }`

### Events

- `GET /api/events`

  - **Description**: Get all events for the authenticated user
  - **Auth Required**: Yes
  - **Response**: Array of event objects

- `POST /api/events`

  - **Description**: Create a new event
  - **Auth Required**: Yes
  - **Body**: `{ "title": "string", "startTime": "ISO_date_string", "endTime": "ISO_date_string" }`
  - **Response**: Created event object

- `PUT /api/events/:id`

  - **Description**: Update an event (can change status to SWAPPABLE)
  - **Auth Required**: Yes
  - **Body**: `{ "title"?: "string", "startTime"?: "ISO_date_string", "endTime"?: "ISO_date_string", "status"?: "BUSY|SWAPPABLE|SWAP_PENDING" }`
  - **Response**: Updated event object

- `DELETE /api/events/:id`
  - **Description**: Delete an event
  - **Auth Required**: Yes
  - **Response**: `{ "message": "Event deleted" }`

### Swaps

- `GET /api/swappable-slots`

  - **Description**: Get all swappable slots from other users
  - **Auth Required**: Yes
  - **Response**: Array of swappable event objects

- `POST /api/swap-request`

  - **Description**: Create a swap request
  - **Auth Required**: Yes
  - **Body**: `{ "mySlotId": "event_id", "theirSlotId": "event_id" }`
  - **Response**: Created swap request object

- `POST /api/swap-response/:requestId`

  - **Description**: Accept or reject a swap request
  - **Auth Required**: Yes
  - **Body**: `{ "accepted": true/false }`
  - **Response**: Updated swap request object

- `GET /api/swap-requests`
  - **Description**: Get incoming and outgoing swap requests for the user
  - **Auth Required**: Yes
  - **Response**: `{ "incoming": [...], "outgoing": [...] }`

## Database Models

### User

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed)
}
```

### Event

```javascript
{
  title: String (required),
  startTime: Date (required),
  endTime: Date (required),
  status: String (enum: ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'], default: 'BUSY'),
  userId: ObjectId (ref: 'User', required)
}
```

### SwapRequest

```javascript
{
  requesterId: ObjectId (ref: 'User', required),
  requestedSlotId: ObjectId (ref: 'Event', required),
  offeredSlotId: ObjectId (ref: 'Event', required),
  status: String (enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING'),
  createdAt: Date (default: now)
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

Error responses include a message field with details.

## Assumptions

- MongoDB connection is stable
- Users provide valid data formats
- JWT tokens are handled securely on the client side

## Challenges Faced

- Ensuring data integrity during swap operations
- Handling concurrent requests to the same slots
- Proper authentication middleware implementation
- Managing complex relationships between users, events, and swap requests

## Deployment

The backend is deployed on Render: https://slot-swapper-backend-qk12.onrender.com/

## Repository

GitHub: https://github.com/srisubaramb/slot-swapper-backend

## License

This project is for educational purposes as part of the ServiceHive SDE Assignment.
