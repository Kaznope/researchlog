# ResearchLog

ResearchLog is a static, browser-based research project tracking service for student researchers, undergraduate researchers, graduate students, and early-stage researchers. It helps users create research projects, track progress through scheduled tasks, connect paper notes to each project, and review research history in a clean academic dashboard.

The app runs entirely with HTML, CSS, and JavaScript. Data is saved in the browser with `localStorage`.

## Project Overview

ResearchLog is organized around research projects rather than one-time activity logs. A user enters a name or email on the home screen to open a local personal workspace. After entering the workspace, the user can create new projects, review project summaries on the dashboard, open project details, update research progress, manage next tasks with due dates, and attach related paper notes.

## Main Features

- Home screen with a polished ResearchLog wordmark and application-style logo
- Local account-style entry using a name or email
- Dashboard with project counts by status:
  - Total projects
  - Completed projects
  - In-progress projects
  - Planned projects
- Project summary cards with:
  - Project status
  - Project-level completion rate
  - Research process summary
  - Next scheduled task
  - Related paper count
- Automatic project completion rate based on completed task checkboxes
- Automatic project status based on completion rate:
  - 0%: Planned
  - 1-99%: In Progress
  - 100%: Completed
- Project detail page with research process, next tasks, and related papers
- Edit mode for project details, including:
  - Research process editing
  - Next task creation and deletion
  - Due date entry for each task
  - Task completion checkboxes
  - Related paper note creation
- Related paper notes with title, authors, content summary, and research relevance
- Research history page with project search and status filtering
- Sample data loading with planned, in-progress, and completed project examples
- Clear current account data with confirmation
- Responsive layout for desktop, tablet, and mobile screens
- Data persistence across browser refreshes using `localStorage`

## Technologies Used

- HTML
- CSS
- JavaScript
- Browser `localStorage`

No backend server, database, framework, package manager, build step, or external UI library is required.

## How to Run Locally

Open `index.html` directly in a web browser.

Recommended local test flow:

1. Open `index.html`.
2. Enter a name or email on the home screen.
3. Use the new project button to create a research project.
4. Add next tasks with due dates.
5. Return to the dashboard and open a project card.
6. Use the edit button on the project detail page.
7. Check task completion boxes and confirm the project completion rate and status update automatically.
8. Add a related paper note from the project edit screen.
9. Refresh the browser and confirm saved data remains.
10. Use sample data and clear data buttons to test demo states.

## How to Use the Service

1. Start from the home page and enter a name or email.
2. Use the dashboard to review all projects at a glance.
3. Create a new project only when starting a new research project.
4. Click a project card to open its detail page.
5. Use edit mode to update research progress, next tasks, and related papers.
6. Check completed tasks to update completion rate and status automatically.
7. Use the history page to search and filter previous projects.

## Deployment

This project can be deployed as a static website on services such as Vercel, Netlify, or GitHub Pages.

Deployment URL: `https://your-deployment-url.example`

## AI Assistance Note

This project was developed with AI assistance using OpenAI Codex CLI. AI was used to help plan the static web app structure, implement HTML/CSS/JavaScript features, improve UI layout, debug localStorage and routing behavior, refine project-based workflows, and prepare project documentation. The final implementation was reviewed and adjusted to match the actual project requirements.
