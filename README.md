# TravelNest

An Airbnb-style booking app: browse stays, view photo galleries, book dates, and list your own place as a host.

**Live demo:** https://mern-booking-webapp.netlify.app. Use **Try the demo account** on the login page, or sign up.

## Features

- Browse and search stays by location and number of guests
- Place pages with a photo mosaic and full-screen gallery, perks, house rules and check-in times
- Booking with date validation, a live price breakdown and double-booking protection
- My bookings: upcoming and past trips, booking details, cancellation
- Hosting: create, edit and delete listings; upload photos (compressed in the browser) or add them by link; choose a cover photo
- JWT authentication with protected routes

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router, Tailwind CSS, Vite, lucide-react |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, Multer |
| Database | MongoDB Atlas; photos stored in **GridFS** so they survive redeploys |
| Hosting | One Netlify site: static frontend + the Express API as a Netlify Function at `/api/*` (same origin, so no CORS setup) |

The server computes every booking's price from the listing's nightly rate and rejects overlapping dates, past check-ins and over-capacity bookings. It never trusts the price the browser sends.

## Project structure

```
client/                React app (Vite)
server/app.js          Express API (all routes)
server/models/         Mongoose models: User, Place, Booking
server/seed.js         Demo listings + demo account
server/dev.js          Local API server
netlify/functions/     Wraps the Express app as a serverless function
netlify.toml           Build, functions and redirects
```

## Running locally

```bash
npm install                 # server deps
npm --prefix client install # client deps
cp .env.example .env        # then fill in MONGO_URL and JWT_SECRET
npm run seed                # optional: demo listings + demo account
npm run dev:server          # API on http://localhost:4000
npm run dev:client          # app on http://localhost:5173 (proxies /api)
```

## API

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/api/register`, `/api/login` | | Returns `{ token, user }` |
| GET | `/api/profile` | ✓ | Current user |
| GET | `/api/places?q=&guests=` | | Search listings |
| GET | `/api/places/:id`, `/api/places/:id/booked` | | Listing, booked date ranges |
| GET | `/api/user-places` | ✓ | Your listings |
| POST / PUT / DELETE | `/api/places`, `/api/places/:id` | ✓ | Create / update / delete (owner only) |
| POST | `/api/upload`, `/api/upload-by-link` | ✓ | Store photos in GridFS |
| GET | `/api/photos/:id` | | Serve a photo (cached immutably) |
| GET / POST | `/api/bookings` | ✓ | Your bookings / create a booking |
| DELETE | `/api/bookings/:id` | ✓ | Cancel an upcoming booking |

Demo listing photos are public-domain / CC0 images from [Wikimedia Commons](https://commons.wikimedia.org).
