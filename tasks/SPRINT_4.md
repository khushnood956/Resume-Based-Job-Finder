# Sprint 4: Client Portal & Web Dashboard

## Sprint Overview
* **Goal**: Build highly polished, responsive web user interfaces using Next.js and Vanilla CSS modules. Deploy all components to production hosting environments.
* **Duration**: 2 Weeks

---

## Tasks

### TS-4.1: Styles & Token System
* **Task ID**: `TS-4.1`
* **Title**: Global CSS variable definitions
* **Description**: Create styling foundations in `frontend/src/app/globals.css`. Configure color presets, typeface spacing rules, cards designs, and transitions.
* **Dependencies**: `TS-1.1`
* **Difficulty**: Easy
* **Estimated Time**: 3 hours
* **Acceptance Criteria**:
  - [x] Styles are loaded globally.
  - [x] Themes (light/dark parameters) are defined via CSS variables.
* **Deliverables**: `frontend/src/app/globals.css`.

### TS-4.2: Auth Layouts & Forms
* **Task ID**: `TS-4.2`
* **Title**: Login, Signup, & Recovery UI pages
* **Description**: Design authentication pages with input validation and session redirects using Supabase Auth helpers.
* **Dependencies**: `TS-4.1`
* **Difficulty**: Easy
* **Estimated Time**: 5 hours
* **Acceptance Criteria**:
  - [x] Account creation, login, and recovery forms work correctly.
  - [x] Visual styling matches premium standards (rounded input grids, smooth hover transitions, glassmorphic card layouts).
* **Deliverables**: Authentication screen components.

### TS-4.3: Onboarding & Resume Upload Wizard
* **Task ID**: `TS-4.3`
* **Title**: Resume dropzone & tags validation screen
* **Description**: Implement a drag-and-drop file upload screen. While processing, show skeleton loading animations. On parsing completion, display an interactive tag management UI to review, delete, or add skills.
* **Dependencies**: `TS-1.6`, `TS-4.1`
* **Difficulty**: Hard
* **Estimated Time**: 12 hours
* **Acceptance Criteria**:
  - [x] File drag-and-drop handles drops/clicks.
  - [x] Loading skeleton runs during active API parsing.
  - [x] User can manually add or delete skills as tags.
* **Deliverables**: Upload wizard UI components.

### TS-4.4: Recommended Jobs Dashboard
* **Task ID**: `TS-4.4`
* **Title**: Jobs recommendation grid layout
* **Description**: Build main dashboard page listing matching job cards sorted by compatibility score. Include text filters and search inputs.
* **Dependencies**: `TS-3.2`, `TS-4.1`
* **Difficulty**: Medium
* **Estimated Time**: 8 hours
* **Acceptance Criteria**:
  - [x] Cards display title, company, location, match score, and relative post dates.
  - [x] Filters for location, remote-only, and minimum match score work responsively.
* **Deliverables**: Recommended jobs dashboard components.

### TS-4.5: Job Detail Modal & Learning Resource Links
* **Task ID**: `TS-4.5`
* **Title**: Slide-out info card with skill gaps
* **Description**: Design interactive slide-out panel or modal detailing the job, salary ranges, match descriptions, missing skills, and direct clickable links to free learning pages.
* **Dependencies**: `TS-4.4`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [x] Modal displays full description.
  - [x] Compiles missing skills and provides links to learning materials.
* **Deliverables**: Job details modal component.

### TS-4.6: Saved Bookmarks Page
* **Task ID**: `TS-4.6`
* **Title**: Saved job list & status trackers
* **Description**: Create page displaying bookmarked jobs. Users can filter by status (e.g. "Applied", "Interviewing") to track their job search progress.
* **Dependencies**: `TS-4.4`
* **Difficulty**: Easy
* **Estimated Time**: 4 hours
* **Acceptance Criteria**:
  - [x] User can bookmark/unbookmark from job cards/modals.
  - [x] Status updates write to the database and reflect in UI lists.
* **Deliverables**: Bookmarked jobs page component.

### TS-4.7: User Settings & Alerts Panel
* **Task ID**: `TS-4.7`
* **Title**: Profile & notifications preference setup
* **Description**: Build a page where users can manage their details (preferred city, experience level) and toggle notification alerts (Email / Telegram integration info).
* **Dependencies**: `TS-4.4`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [x] Updates to preferences save to Supabase profiles.
  - [x] Displays unique Telegram verification tokens for users linking chats.
* **Deliverables**: Settings page component.

### TS-4.8: Live Production Launch
* **Task ID**: `TS-4.8`
* **Title**: Cloud hosting deployment execution
* **Description**: Configure Next.js environment configurations on Vercel and deploy. Deploy the python parser service to Koyeb/Render. Verify production keys and end-to-end integration.
* **Dependencies**: All previous tasks
* **Difficulty**: Medium
* **Estimated Time**: 8 hours
* **Acceptance Criteria**:
  - [x] Web platform runs in cloud production environments.
  - [x] Operational cost remains at $0/month.
* **Deliverables**: Live production website links.
