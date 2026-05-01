# 🐾 Paws & Palms Pet Spa - Mobile App


A premium full-stack mobile application built using the MERN stack with Expo (React Native). This platform allows pet owners to book grooming sessions, spa treatments, and pet care services with ease.

## 🏗️ Project Architecture

The project is organized into two main directories for a clean separation of concerns:

```text
Paws-and-Palms-Pet-Spa/
├── backend/            # Node.js + Express + MongoDB Server
│   ├── src/            # Backend source code
│   └── server.js       # Entry point
│
└── frontend/           # Expo (React Native) Mobile Application
    ├── app/            # Screens (Expo Router)
    ├── components/     # Reusable UI components
    ├── constants/      # Design system (Colors, Spacing)
    └── styles/         # Global & Screen styles
```

---

## 🛠️ Technologies Used

### Frontend
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (File-based routing)
- **Styling**: Native CSS-in-JS (StyleSheet)
- **Theme**: Premium Dark mode with "Paws & Palms" branding

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JSON Web Tokens (JWT) & Bcrypt

---

## 🚀 Getting Started

### 1️⃣ Prerequisites
- **Node.js**: Version 18 or 20 recommended.
- **Expo Go App**: Download on your [iOS](https://apps.apple.com/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device.

### 2️⃣ Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file with your MongoDB connection string (See `PRIVATE_LOCAL_FILES` for your local backup).
4. Start the server:
   ```bash
   npm run dev
   ```

### 3️⃣ Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your phone using the **Expo Go** app.

---

## 🎯 Project Roadmap

- [x] Project Structure Setup
- [x] Welcome & Authentication UI (Paws & Palms Branding)
- [x] Basic Backend API setup
- [x] User Registration & Login
- [ ] Pet Profile Management
- [ ] Appointment Booking System
- [ ] Service Catalog & Pricing

---

