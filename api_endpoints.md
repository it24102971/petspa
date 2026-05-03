# PetSpa API Endpoint Reference

[ignoring loop detection]

This document contains a comprehensive list of all API endpoints for the PetSpa application.

## 1. Authentication & Profile (`/api/auth`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | User login |
| PUT | `/profile` | Yes | Update user profile |
| POST | `/profile-picture` | Yes | Upload profile picture |
| GET | `/dashboard-stats` | Yes | Get user dashboard metrics |

## 2. Admin Operations (`/api/admin`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/dashboard-stats` | Admin | System-wide statistics |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/toggle` | Admin | Toggle user active status |
| GET | `/groomers` | Admin | List all groomers |
| POST | `/groomer` | Admin | Add a new groomer |
| GET | `/pets` | Admin | List all pets |
| PUT | `/pets/:id` | Admin | Update pet (admin) |
| DELETE | `/pets/:id` | Admin | Delete pet (admin) |
| GET | `/reviews` | Admin | List all reviews |

## 3. Pet Management (`/api/pets`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| POST | `/` | Yes | Create new pet |
| GET | `/` | Yes | List user's pets |
| PUT | `/:id` | Yes | Update pet |
| DELETE | `/:id` | Yes | Delete pet |

## 4. Spa Services & Bookings (`/api/spa-services`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/` | No | List services |
| GET | `/groomers` | No | List available groomers |
| POST | `/` | Admin | Create service |
| PUT | `/:id` | Admin | Update service |
| DELETE | `/:id` | Admin | Delete service |
| POST | `/book` | Yes | Book a spa service |
| GET | `/bookings` | Yes | List bookings |
| PUT | `/bookings/:id/verify` | Admin | Verify payment |
| PUT | `/bookings/:id/accept` | Groomer | Accept job |
| PUT | `/bookings/:id/complete` | Groomer | Complete job |

## 5. Spa Diary (`/api/diary`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| POST | `/` | Yes | Create diary entry |
| GET | `/feed` | No | Public feed entries |
| GET | `/mine` | Yes | User's own entries |
| PUT | `/:id` | Yes | Update entry |
| DELETE | `/:id` | Yes | Delete entry |

## 6. Pet Cafe (`/api/cafe`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/items` | No | List cafe menu items |
| POST | `/items` | Admin | Add menu item |
| PUT | `/items/:id` | Admin | Update menu item |
| DELETE | `/items/:id` | Admin | Delete menu item |
| GET | `/orders` | Yes | List user's orders |
| POST | `/order` | Yes | Place cafe order |
| PUT | `/orders/:id/verify` | Admin | Verify order payment |

## 7. Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| GET | `/` | Yes | Get user notifications |
| PUT | `/read-all` | Yes | Mark all as read |
| DELETE | `/:id` | Yes | Delete notification |
