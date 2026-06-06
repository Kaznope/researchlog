# ResearchLog

ResearchLog is a static academic dashboard for student researchers, undergraduate researchers, graduate students, and early-stage researchers. It helps users record research activities, manage paper notes, and review research progress through a clean single-page workspace designed for final assignment submission.

## Main Features

- Fixed top navigation with smooth movement and active states between Home, Dashboard, Research Log, Paper Notes, and About sections
- Landing section with clear calls to add a research log or paper note
- Research activity form with date, project name, activity type, status, summary, and optional next action fields
- Friendly validation messages that prevent blank required research logs
- Search for research logs by project name, summary, next action, or activity type
- Activity type and status filters that work together with search
- Dynamic research log cards with activity/status badges, delete controls, and inline status updates
- Dashboard summary cards for total logs, completed logs, in-progress logs, planned logs, and completion rate
- Completion progress bar that stays at 0% when there are no logs
- Recent Logs dashboard section showing the three latest research logs as compact previews
- Paper note form with required paper title and key finding fields
- Dynamic paper note cards with delete controls
- Empty states for no research logs, no paper notes, and no matching filtered/search results
- Load Sample Data button with at least three research logs and two paper notes for demos
- Clear All Data button with confirmation before deleting local data
- localStorage persistence for logs and paper notes across refreshes
- Responsive academic dashboard layout for desktop, tablet, and mobile
- Footer with project and final assignment context

## Technologies Used

- HTML
- CSS
- JavaScript
- Browser localStorage

No React, Next.js, backend server, database, npm packages, external UI libraries, login, or authentication are used.

## How to Run Locally

Open `index.html` directly in a web browser.

Local test checklist:

1. Add a research log, refresh the page, and confirm the log remains available.
2. Search by project name, summary, next action, and activity type.
3. Combine search with the activity and status filters.
4. Change a log status from the card and confirm dashboard statistics update immediately.
5. Delete a log and confirm Recent Logs and dashboard statistics update.
6. Add and delete a paper note and confirm research logs are unaffected.
7. Submit blank required fields and confirm friendly validation messages appear.
8. Load sample data, then use Clear All Data and confirm the empty states return.
9. Open browser developer tools and confirm normal use does not create console errors.

## Deployment

This project can be deployed to Vercel as a static website.

Vercel URL: `https://your-vercel-url.vercel.app`

## AI Assistance Note

This project was created with AI assistance. The generated code was organized into static HTML, CSS, and JavaScript files and designed to run without a build step or external dependencies.
