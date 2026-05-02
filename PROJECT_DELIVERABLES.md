# 🐾 Paws & Pastries: Technical Project Proposal 🧁

## 1. Problem Statement
The pet spa and bakery industry is currently fragmented, with many establishments relying on manual, paper-based records for pet registrations, appointments, and cafe orders. This leads to information silos, scheduling conflicts, and a poor customer experience. **Paws & Pastries** is a unified MERN stack application designed to digitize these operations, providing a seamless Kawaii-themed interface for pet owners and staff to manage pet profiles, book spa sessions, order treats, and maintain a digital memory book.

---

## 2. System Architecture
The application uses a modular MERN architecture with a dedicated mobile interface for front-desk and on-the-go management.

```mermaid
graph TD;
    A[Mobile App - React Native] -->|JWT Auth / REST| B[Express Backend];
    C[Web Portal - React] -->|JWT Auth / REST| B;
    B -->|Mongoose| D[MongoDB Atlas];
    B -->|Bcrypt| E[Security Layer];
    B -->|Multer| F[Cloud/Local Image Storage];
```

---

## 3. Database Schema
The database uses normalized relational patterns within MongoDB to ensure data integrity across multiple modules.

```mermaid
erDiagram
    USER ||--o{ PET : "registers"
    USER {
        ObjectId id
        string name
        string email
        string password_hash
        string role
    }
    PET ||--o{ APPOINTMENT : "books"
    PET {
        ObjectId id
        string name
        string breed
        string image_url
        string cuteness_level
    }
    SERVICE ||--o{ APPOINTMENT : "scheduled"
    SERVICE {
        ObjectId id
        string name
        number price
        string duration
    }
    APPOINTMENT {
        ObjectId id
        date appointment_date
        string time_slot
        string status
    }
```

---

## 4. API Endpoints Table

| Category | Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/register` | Create new staff/user account | Public |
| **Auth** | POST | `/api/auth/login` | Authenticate and receive JWT | Public |
| **Pets** | GET | `/api/pets` | List all registered pets | Token |
| **Pets** | POST | `/api/pets` | Add a new pet to registry | Token |
| **Pets** | PUT | `/api/pets/:id` | Update pet information | Token |
| **Pets** | DELETE | `/api/pets/:id` | Remove pet from system | Admin |
| **Services** | GET | `/api/services` | View available spa treatments| Public |

---

## 5. Team Responsibility Breakdown

| Student Role | Domain | Responsibilities |
| :--- | :--- | :--- |
| **Group Lead** | Authentication | Password hashing, JWT strategy, User management |
| **Student 1** | Pet Registry | Full CRUD for Pets, Photo upload, Mobile Registry UI |
| **Student 2** | Spa Menu | Service entity CRUD, Dynamic pricing logic |
| **Student 3** | Appointments | Booking calendar logic, Conflict prevention |
| **Student 4** | Cafe Shop | Inventory management, Order processing |
| **Student 5** | Memory Book | Diary CRUD, Image processing/display |
| **Student 6** | Staff Portal | Employee profiles, Ratings/Specialties registry |

---

## 🛠 MongoDB Atlas Setup Troubleshooting
If your connection is still failing, check these 3 common issues:
1. **IP Whitelisting**: Ensure `0.0.0.0/0` is added to your Network Access list in Atlas for development.
2. **Password Special Characters**: If your database user password has `@`, `#`, or `:`, it must be URL-encoded (e.g., `@` becomes `%40`).
3. **Database Name**: Ensure your connection string includes `/paws-pastries` (or your DB name) before the `?retryWrites=true` part.

**Example .env line:**
`MONGO_URI=mongodb+srv://admin:myPassword123@cluster0.abcde.mongodb.net/paws-pastries?retryWrites=true&w=majority`
