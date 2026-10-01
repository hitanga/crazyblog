# GutenVerse — Editorial Magazine & Blog with JSON CMS

A professional, fully responsive magazine and blog publication powered by **React JS (JSX)** on the frontend, **Express REST API** on the backend, **Firebase Authentication**, and a clean **JSON file-based CMS storage engine** where every single article has its own dedicated directory.

Inspired by premium editorial layouts with bold typography, spacious white canvas, dark charcoal headings, and minimal coral accents.

---

## 🌟 Key Architecture & Highlights

- **Pure JavaScript & React Hooks**: Built strictly with `.js` and `.jsx` files (no TypeScript on the frontend).
- **JSON Filesystem Database**: Zero SQL, MongoDB, or external database setups required. Each post is stored in `server/data/posts/[slug]/post.json` and its comments in `comments.json`.
- **Firebase Authentication**: Administrative CMS routes are secured using Firebase Email/Password authentication. Includes a fallback session adapter for instant local evaluation without pre-configured keys.
- **Full CMS Management**:
  - Create, Edit, and Delete dispatches with real filesystem persistence.
  - Automatic slug generator with manual slug override.
  - Category assignment and featured post toggles.
  - Dual image workflow: Live image URL preview + local image uploads to `server/public/uploads`.
  - Comment moderation: Approve, pending review, or delete reader responses.
- **Editorial Magazine Layout**:
  - High-impact Hero Featured Article with overlapping white editorial panel.
  - Responsive 3-column article grid (`Latest Stories`).
  - Asymmetric `Staff's Picks` layout.
  - Rich reading layout with blockquotes, drop caps, and code snippets.
  - Reader comment submission with real-time updates.
  - Live client & archive search (`/search?q=...`).
  - Category archive pages (`/category/:category`).
  - Related stories recommendation on article pages.

---

## 📁 Project Directory Structure

```text
├── index.html                   # HTML entry point with Google Fonts (Montserrat & Roboto)
├── package.json                 # Project dependencies & scripts
├── server.ts                    # Express REST API & Vite middleware entry
├── metadata.json                # AI Studio application metadata
├── .env.example                 # Environment variables reference template
├── README.md                    # Full documentation & deployment guide
├── server/
│   ├── data/
│   │   └── posts/               # JSON Storage Engine
│   │       ├── at-daybreak-of-the-fifteenth-day-of-my-search/
│   │       │   ├── post.json
│   │       │   └── comments.json
│   │       ├── the-sunset-faded-to-twilight/
│   │       │   ├── post.json
│   │       │   └── comments.json
│   │       ├── react-js-guide/
│   │       │   ├── post.json
│   │       │   └── comments.json
│   │       └── ...
│   └── public/
│       └── uploads/             # Physical local image uploads
└── src/
    ├── assets/                  # Generated editorial photographs
    ├── config/
    │   ├── siteConfig.js        # Logo name, tagline, branding & social links
    │   ├── navigation.js        # Top navigation menu items & paths
    │   └── firebase.js          # Firebase authentication initialization & handlers
    ├── context/
    │   └── AuthContext.jsx      # React authentication state provider
    ├── services/
    │   └── api.js               # REST API client for backend communication
    ├── components/
    │   ├── Logo.jsx             # Distinctive editorial logo component
    │   ├── Header.jsx           # Top header, social links, search overlay, desktop/mobile nav
    │   ├── HeroPost.jsx         # Large featured hero section with overlapping content panel
    │   ├── LatestStories.jsx    # 3-column article grid with "More Posts" CTA
    │   ├── PostCard.jsx         # Modern magazine card with metadata & coral accent line
    │   ├── StaffPicks.jsx       # Editorial featured picks layout
    │   ├── CommentList.jsx      # Approved reader comments
    │   ├── CommentForm.jsx      # Interactive comment submission form
    │   ├── SocialShare.jsx      # Share buttons (X/Twitter, Facebook, LinkedIn, Copy Link)
    │   ├── Footer.jsx           # Editorial footer with categories & dispatch newsletter
    │   └── admin/
    │       ├── AdminLayout.jsx  # Admin portal layout with sidebar and breadcrumbs
    │       └── ProtectedRoute.jsx # Route guard verifying administrative authentication
    ├── pages/
    │   ├── Home.jsx             # Front page
    │   ├── BlogList.jsx         # Full archives with category filters and search
    │   ├── BlogDetail.jsx       # Single article page with rich content and related posts
    │   ├── CategoryPage.jsx     # Category-specific archives
    │   ├── SearchPage.jsx       # Search results page
    │   ├── FeaturesPage.jsx     # Architecture & feature showcase
    │   ├── NotFound.jsx         # 404 error page
    │   └── admin/
    │       ├── AdminLogin.jsx   # Admin login with Firebase & instant demo credentials
    │       ├── AdminDashboard.jsx # Dashboard metrics & recent posts table
    │       ├── AdminPosts.jsx   # All posts management table with search and delete modal
    │       ├── AdminPostForm.jsx# Create & Edit post form with live image preview & upload
    │       └── AdminComments.jsx# Comment moderation table (approve, pending, delete)
    ├── App.jsx                  # Main router setup
    ├── main.jsx                 # React root entry
    └── index.css                # Tailwind CSS imports and typography
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the following command from the project root:

```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase project credentials:

```ini
# Firebase Authentication
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Port (default is 3000)
PORT=3000
```

> **Note**: If you run without filling Firebase credentials immediately, the application seamlessly activates an internal administrative session adapter. You can click the **"Autofill Demo Credentials"** button on `/admin/login` (`admin@gutenverse.com` / `admin123`) to immediately test all CMS capabilities!

### 3. Start the Application
Run the full-stack server (Express REST API + Vite frontend mounted via Vite middlewares on port 3000):

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🗄️ How the JSON Storage Engine Works

Unlike database setups that require connection strings, migrations, and external daemons:

1. **Every blog post has its own folder** inside `server/data/posts/`:
   ```text
   server/data/posts/complete-react-js-guide/
       ├── post.json
       └── comments.json
   ```
2. **`post.json` schema**:
   ```json
   {
     "id": "complete-react-js-guide",
     "title": "Complete React JS Guide: Architecture & State Mastery",
     "slug": "complete-react-js-guide",
     "excerpt": "A beginner friendly guide to React JS...",
     "image": "/src/assets/images/hero_urban_avenue.jpg",
     "category": "Technology",
     "author": "Admin",
     "date": "2026-10-01",
     "content": "<p>Article HTML content...</p>",
     "featured": true
   }
   ```
3. **`comments.json` schema**:
   ```json
   [
     {
       "id": "c-101",
       "name": "Jane Reader",
       "email": "jane@example.com",
       "comment": "Superb analysis on component structure!",
       "date": "2026-10-01",
       "approved": true
     }
   ]
   ```
4. **CRUD Lifecycle**:
   - **Create Post**: Generates `server/data/posts/[slug]`, writes `post.json`, and writes `comments.json`.
   - **Edit Post**: Updates `post.json` (and automatically renames the directory if the slug is updated).
   - **Delete Post**: Completely removes the folder `server/data/posts/[slug]` and its comments.
   - **Comments**: Public reader submissions append to `comments.json`. The CMS allows one-click approval or deletion.

---

## ✏️ Customization Guide

### 1. Changing the Logo and Tagline
Edit `src/config/siteConfig.js`:

```javascript
const siteConfig = {
  name: "YOUR MAGAZINE",
  tagline: "YOUR CUSTOM TAGLINE OR PUBLICATION MOTTO",
  description: "Your magazine description...",
};

export default siteConfig;
```
The `Logo.jsx` and `Header.jsx` components automatically reflect your changes.

### 2. Modifying Navigation Links
Edit `src/config/navigation.js`:

```javascript
const navigation = [
  { label: "Home", path: "/" },
  { label: "Dispatches", path: "/blog" },
  { label: "Architecture", path: "/category/Architecture" },
  { label: "About", path: "/features" },
];

export default navigation;
```

### 3. Adding New Categories
Categories are dynamically inferred from your posts. Whenever you create or edit an article and specify a new category (e.g. `Architecture`, `Photography`, `Artificial Intelligence`), it automatically registers across the navbar, filter buttons, and archives!

---

## 🌐 Express REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/posts` | List posts (`?category=`, `?search=`, `?featured=true`) |
| `GET` | `/api/posts/:slug` | Retrieve single post detail & approved comments |
| `POST` | `/api/posts` | Create new post directory and JSON files |
| `PUT` | `/api/posts/:slug` | Update existing post JSON |
| `DELETE` | `/api/posts/:slug` | Delete post folder and its comments |
| `GET` | `/api/posts/:slug/comments` | Retrieve comments (`?all=true` for admin) |
| `POST` | `/api/posts/:slug/comments` | Submit reader response |
| `PUT` | `/api/posts/:slug/comments/:commentId` | Update comment (approve/pending) |
| `DELETE` | `/api/posts/:slug/comments/:commentId` | Delete comment |
| `GET` | `/api/categories` | Unique categories with article counts |
| `GET` | `/api/stats` | Aggregate dashboard statistics |
| `GET` | `/api/comments/all` | List all comments across all articles |
| `POST` | `/api/upload` | Multipart image file upload (Multer) |

---

## ⚠️ Important Deployment Notice

Because this application writes JSON files directly to the filesystem:
- **Recommended Environments**: A persistent Node.js server, Virtual Private Server (VPS like DigitalOcean, Linode, AWS EC2), or container with a persistent volume.
- **Serverless Environments**: Platforms like AWS Lambda, Vercel, or Netlify functions have read-only or ephemeral temporary filesystems (`/tmp`), meaning any newly created posts or comments would be reset when instances spin down. For serverless deployments, mount a persistent disk volume or sync the `server/data/posts` directory to an object bucket (e.g. Google Cloud Storage or AWS S3).
- **Building for Production**:
  ```bash
  npm run build
  npm start
  ```
  The production server will serve the static bundle in `dist/` while managing API requests and filesystem operations seamlessly.

---

## 📄 License
MIT License. Crafted for modern editorial storytelling.
