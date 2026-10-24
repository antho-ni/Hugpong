# Hugpong Kape

A student concept coffee shop that buys beans from highland farmers and shares part of every sale with them. It is a class project, not a real business. The site has a sales page, a real login and register system, a customer account with a stamp card, and a staff desk.

## Run it in VS Code

1. Install Node.js (version 22.13 or newer) from https://nodejs.org. The database is built into Node, so nothing else needs installing or compiling.
2. In VS Code choose File > Open Folder and open this folder.
3. Open a terminal (Terminal > New Terminal) and run:

   ```
   npm install
   npm start
   ```

4. Open http://localhost:3000 in your browser.

`npm run dev` restarts the server every time you save a server file.

## Accounts

- **Customers** register on the site. They get a stamp card and a running total of what they have sent to the farmers.
- Customers may request student pricing during registration, but staff must verify the request before the discount becomes active.
- **Staff** cannot register. The first run creates one staff account:
  - email: `staff@hugpong.demo`
  - password: `barista-demo`

  To use your own details, set them before the very first run (the database is created then):

  ```
  STAFF_EMAIL=you@example.com STAFF_PASSWORD=a-long-password npm start
  ```

  On Windows PowerShell:

  ```
  $env:STAFF_EMAIL="you@example.com"; $env:STAFF_PASSWORD="a-long-password"; npm start
  ```

- Staff add stamps, record a P10 sponsor add-on, redeem free cups and edit menu prices.
- Staff can verify or reject pending student-pricing requests from the staff desk.
- To start over, stop the server and delete `hugpong.db`.

## Files

| File | What it does |
| --- | --- |
| `server.js` | Application entry point and first-run staff account setup |
| `src/app.js` | Express middleware, sessions, route mounting and static files |
| `src/config/environment.js` | Validated runtime and session configuration |
| `src/routes/auth.js` | Registration, login, logout and current-user endpoints |
| `src/routes/public.js` | Public menu and opening-list endpoints |
| `src/routes/staff.js` | Staff-only customer and menu endpoints |
| `src/middleware/auth.js` | Session lookup and role-protection middleware |
| `src/middleware/errors.js` | API not-found and centralized error responses |
| `src/services/auth-service.js` | Password hashing, safe user output and session creation |
| `db.js` | Creates the SQLite database and tables (`users`, `menu`, `interest`) using the `node:sqlite` module built into Node |
| `public/index.html` | The whole site: sales page, login, register, account, staff desk |
| `public/styles.css` | All styling, with light and dark themes |
| `public/app.js` | Front end logic that calls the API |
| `public/images/` | Images and visual assets used by the site |
| `hugpong.db` | The database file, created on first run (not committed to git) |

## API

| Route | Who | What |
| --- | --- | --- |
| `POST /api/register` | anyone | Create a customer account and log in |
| `POST /api/login` | anyone | Log in |
| `POST /api/logout` | anyone | Log out |
| `GET /api/me` | anyone | Current user, or `null` |
| `GET /api/menu` | anyone | The menu and prices |
| `POST /api/interest` | anyone | Save an email for the opening list |
| `GET /api/staff/customers` | staff | List customers |
| `POST /api/staff/customers/:id/stamp` | staff | Add a stamp (stops at 9) |
| `POST /api/staff/customers/:id/sponsor` | staff | Add P10 to the farmer sponsor total |
| `POST /api/staff/customers/:id/redeem` | staff | Redeem a free cup when the card has 9 stamps |
| `POST /api/staff/customers/:id/student/verify` | staff | Approve a pending student-pricing request |
| `POST /api/staff/customers/:id/student/reject` | staff | Reject a pending student-pricing request |
| `PUT /api/staff/menu` | staff | Change menu prices |

## What protects the accounts

- Passwords are hashed with bcrypt and never stored or sent back.
- Sessions use an `httpOnly`, `sameSite=lax` cookie, and the session id is replaced on every login.
- Every staff route checks the role on the server, so hiding a button in the page is not what keeps customers out.
- SQL uses prepared statements, and the page builds its content with `textContent`, which blocks SQL injection and script injection.
- Login is limited to 8 failed tries per 15 minutes for each IP and email.

## Before you put it online

- Set `NODE_ENV=production` and a long random `SESSION_SECRET`. The server refuses to start in production without one.
- Serve it over HTTPS. The cookie is only sent over HTTPS in production mode.
- Change the staff password.
- Sessions are kept in memory, so everyone is logged out when the server restarts. A session store such as `connect-sqlite3` fixes that if you need it.

## Notes for your report

- The partner farmers, prices, percentages and address are sample content, and the footer says so.
- The idea is inspired by a university and farmer partnership. It is not an official University of St. La Salle project, and it does not use the university's logo.
