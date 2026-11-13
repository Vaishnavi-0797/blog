# Inkwell – Blog Platform with Comments

A full-stack blogging platform. Users can register, log in, write posts (drafts or published), edit and delete their own posts, search and filter articles, and discuss them in comments.

## Features

- **Authentication:** register, login, logout, bcrypt-hashed passwords, JWT sessions, protected routes
- **Blog posts:** create, read, update, delete; draft or published; category; featured image (link or upload); auto excerpt
- **Ownership rules:** only the author can edit or delete their own posts and comments (enforced on the server)
- **Comments:** add, edit, delete without reloading the page; commenter name and date/time; empty-state message
- **Search and categories:** search by title or keyword, filter by category, sort by newest, oldest or most discussed, pagination
- **Profile:** name, email, bio, published articles and recent comments; edit profile
- **Design:** responsive (desktop, laptop, tablet, mobile), loading indicators, empty states, success and error toasts, confirm-before-delete dialogs

## Technology stack

| Part | Tools |
|---|---|
| Frontend | React, Vite, JavaScript, React Router, Axios, Lucide React, CSS3 |
| Backend | Node.js, Express, REST APIs, JWT (jsonwebtoken), bcryptjs, Multer, dotenv |
| Database | MySQL (mysql2 driver) |

All tools are free and open source. (`bcryptjs` is used instead of `bcrypt`: same hashing algorithm, but installs without compiler problems on Windows.)

## How the pieces fit together (simple English)

1. **Frontend (React)** is what you see in the browser. It never talks to the database directly.
2. **Backend (Express)** is the middleman. The frontend asks it things like "give me all posts" at URLs such as `/api/posts`. The backend checks the request, talks to MySQL and replies with JSON.
3. **Database (MySQL)** stores users, categories, posts and comments in four linked tables.
4. **Login:** when you log in, the server gives you a JWT (a signed ID card). The frontend sends it with every request. The server checks it, and also checks that you own a post or comment before it lets you change it.

## Folder structure

```
blog-platform/
├── README.md
├── .gitignore
├── backend/
│   ├── server.js                 Starts the API
│   ├── package.json
│   ├── .env.example              Copy to .env and fill in
│   ├── config/db.js              MySQL connection
│   ├── controllers/              Logic for auth, posts, comments, categories, users
│   ├── routes/                   URL → controller mapping
│   ├── middleware/               auth (JWT), upload (Multer), error handling
│   ├── database/                 schema.sql, init.js, seed.js
│   ├── utils/helpers.js          Validation helpers
│   ├── tests/api-test.js         Automated API check
│   └── uploads/                  Uploaded images
└── frontend/
    ├── index.html, vite.config.js, package.json
    └── src/
        ├── main.jsx, App.jsx, index.css, pages.css
        ├── components/           Navbar, Footer, PostCard, PostForm, CommentSection, ConfirmDialog, ...
        ├── pages/                Home, BlogList, BlogDetail, Login, Register, Create, Edit, MyBlogs, Profile, Categories, About
        ├── layouts/MainLayout.jsx
        ├── context/              AuthContext, ToastContext
        ├── services/             api.js (Axios), authService.js, blogService.js
        ├── hooks/                useDocumentTitle.js
        └── utils/format.js
```

## Step-by-step setup (beginner friendly)

### 1. Install the tools
- **Node.js** (LTS version, 18 or newer): https://nodejs.org. Check in a terminal with `node -v`.
- **MySQL Community Server**: https://dev.mysql.com/downloads/mysql/. During installation, set a root password and remember it. MySQL Workbench (optional) lets you look at your tables.
- **VS Code**: https://code.visualstudio.com. Useful extensions: *ES7+ React/Redux/React-Native snippets*, *Prettier*, *MySQL* (by Weijan Chen) or use Workbench.

### 2. Open the project
Unzip `blog-platform`, then in VS Code choose **File → Open Folder** and select it. Open the terminal with **Terminal → New Terminal**.

### 3. Backend
In the VS Code terminal (you start in the `blog-platform` folder):

```
cd backend
npm install
```
- `cd backend` moves the terminal into the backend folder.
- `npm install` downloads the libraries listed in `package.json` (into a new `node_modules` folder).

Create your settings file: copy `.env.example` and rename the copy to `.env`. Open it and set:
- `DB_PASSWORD` = your MySQL root password
- `JWT_SECRET` = any long random text (for example 40 random letters and numbers)

Create the database and tables:
```
npm run db:init
```
You should see: *Database "blog_platform_db" is ready*.

(Optional) add demo posts so the site is not empty:
```
npm run db:seed
```
Demo logins: `demo.author@example.com` and `demo.reader@example.com`, password `Demo1234`.

Start the backend and leave this terminal running:
```
npm run dev
```
You should see *Connected to MySQL* and *API running at http://localhost:5000*. Check it by opening http://localhost:5000/api/categories in the browser.

### 4. Frontend
Open a **second** terminal (click the **+** in the terminal panel). Then:

```
cd frontend
npm install
npm run dev
```
(If the new terminal starts in the project root, `cd frontend` is correct. If it is already in `backend`, use `cd ../frontend`.)

Open **http://localhost:5173** in your browser.

## Environment variables (backend/.env)

| Name | Meaning |
|---|---|
| `PORT` | Port for the API (default 5000) |
| `CLIENT_URL` | Address of the frontend, used for CORS (default http://localhost:5173) |
| `DB_HOST`, `DB_PORT` | MySQL location (localhost, 3306) |
| `DB_USER`, `DB_PASSWORD` | Your MySQL login |
| `DB_NAME` | blog_platform_db |
| `JWT_SECRET` | Secret used to sign login tokens. Keep private. |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. 7d |

Never upload `.env` to GitHub (`.gitignore` already excludes it).

## Database

Database `blog_platform_db` with tables `users`, `categories`, `posts`, `comments` (see `backend/database/schema.sql`).

- A user has many posts; a post has many comments; a user has many comments.
- Foreign keys: posts.user_id → users, posts.category_id → categories, comments.post_id → posts, comments.user_id → users.
- `users.email` is unique. Deleting a post deletes its comments; deleting a category keeps the posts (category becomes empty).

## REST API

| Method | Route | Login needed | Purpose |
|---|---|---|---|
| POST | /api/auth/register | no | Create account |
| POST | /api/auth/login | no | Log in, returns token |
| GET | /api/auth/me | yes | Current user |
| GET | /api/posts | no | Published posts. Query: `search`, `category`, `sort` (newest, oldest, popular), `page`, `limit` |
| GET | /api/posts/my-posts | yes | Your posts, including drafts |
| GET | /api/posts/:id | no (drafts: author only) | One post |
| POST | /api/posts | yes | Create post |
| PUT | /api/posts/:id | yes, owner | Update post |
| DELETE | /api/posts/:id | yes, owner | Delete post |
| GET | /api/posts/:id/comments | no | List comments |
| POST | /api/posts/:id/comments | yes | Add comment |
| PUT | /api/comments/:id | yes, owner | Edit comment |
| DELETE | /api/comments/:id | yes, owner | Delete comment |
| GET / POST | /api/categories | POST needs login | List / create categories |
| GET / PUT | /api/users/profile | yes | View / update your profile |
| POST | /api/upload | yes | Upload an image (JPG, PNG, WEBP, GIF up to 3 MB) |

## Security

- Passwords hashed with bcrypt (never stored in plain text)
- JWT authentication; protected routes in both backend and frontend
- Ownership checks on every edit and delete (HTTP 403 for other people's content)
- Parameterized SQL queries (prevents SQL injection)
- Input validation on the server (and in the forms)
- Uploads: only image types, 3 MB limit, random file names chosen by the server
- Article text is rendered as plain text by React, so it cannot run scripts
- Secrets live in `.env`; login errors do not reveal whether an email exists

## How to test

### Automated API test
With the backend running, open a second terminal:
```
cd backend
npm run test:api
```
It creates two temporary users and checks: register, login, wrong password, protected routes, create/read/edit/delete posts, ownership restrictions (403), search by title and keyword, category filter, sorting, comments (add, view, edit, delete, ownership), profile, and deleting a post. Each line prints PASS or FAIL.

### Manual checklist (in the browser)
- [ ] Register with a short password: error appears. Register properly: you are logged in.
- [ ] Log out, log in with a wrong password: error appears. Log in correctly.
- [ ] Refresh the page: you stay logged in.
- [ ] Open /create while logged out: you are sent to the login page.
- [ ] Write a post and **Save draft**: it appears in My Blogs under Drafts, not on Explore Blogs.
- [ ] Edit the draft and **Publish**: it now appears on Explore Blogs and the homepage.
- [ ] Open the post, add a comment, edit it, delete it (a confirmation dialog appears).
- [ ] Log in as a second user: the Edit and Delete buttons do not appear on the first user's post or comments.
- [ ] Search by a word from a title, then by a word from the body. Filter by category. Change sorting.
- [ ] Delete your post: a confirmation dialog appears and the post disappears.
- [ ] Check responsiveness: resize the browser or press F12 and use the device toolbar (phone, tablet, laptop).
- [ ] Database: run `SELECT * FROM blog_platform_db.users;` (password column shows `$2a$...`), and the same for posts and comments.

## Common errors and fixes

| Problem | Fix |
|---|---|
| `'node' is not recognized` | Install Node.js, then close and reopen VS Code |
| `Access denied for user 'root'` | `DB_PASSWORD` in `.env` is wrong |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is not running. Start the MySQL service |
| `Unknown database` or `Table doesn't exist` | Run `npm run db:init` in `backend` |
| `JWT_SECRET is missing` | You have not created `.env` (copy `.env.example`) |
| Site shows "Cannot reach the server" | Backend is not running, or port 5000 is busy |
| `EADDRINUSE: port 5000` | Something else uses the port. Change `PORT` in `.env` and the proxy target in `frontend/vite.config.js` |
| Blank page after `npm run dev` | Press F12, look at the Console, and read the first red error |
| Images from links do not show | The link must start with https:// and point straight to an image |

## Screenshots

Add your own screenshots here before submitting (save them in a `screenshots` folder):

- Homepage
- Blog listing with search and filters
- Blog details with comments
- Create post page
- My Blogs page
- Profile page
- Mobile view

## Notes

- The post's creation date is shown as its publication date.
- Posts are written as plain text (blank line = new paragraph, `## ` = heading) instead of a rich-text editor, to keep the project simple and safe.
