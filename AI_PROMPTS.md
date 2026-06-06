# AI Prompt Log

## Prompt 1: Core Service Implementation

Date: 2026-06-06

Tool: OpenAI Codex CLI

Purpose: Create the first working version of the ResearchLog static web service.

Full Prompt Summary:
Create a complete static web service called ResearchLog using only HTML, CSS, and JavaScript. The service should help student researchers and early-stage researchers track research work. Include a home section, dashboard, research log creation, paper note creation, statistics, progress display, filters, delete controls, and `localStorage` persistence. Use a clean academic dashboard style with navy, white, light gray, and teal accent colors.

Summary of Result:
Generated the initial static ResearchLog app structure with `index.html`, `style.css`, `script.js`, and `README.md`. Implemented the first version of the dashboard, research log cards, paper notes, progress statistics, and local browser storage.

Files Modified:

- index.html
- style.css
- script.js
- README.md

---

## Prompt 2: Feature Improvement and Bug Fixing

Date: 2026-06-06

Tool: OpenAI Codex CLI

Purpose: Improve the service workflow, fix interaction issues, and make the app more complete.

Full Prompt Summary:
Improve the ResearchLog project without changing the main concept unnecessarily. Add search, empty states, sample data, clear data behavior, validation, localStorage loading after refresh, dashboard updates after deletion, and reliable filtering. Fix issues where paper notes and research logs should not interfere with each other, completion rates should not show invalid values, and normal use should avoid console errors.

Summary of Result:
Improved the interaction flow and data handling. Added better validation, sample data loading, clear data confirmation, empty states, search/filter behavior, localStorage persistence, and dashboard statistic updates. Later iterations also changed the data model into project-based tracking with related paper notes and task-based progress.

Files Modified:

- index.html
- style.css
- script.js
- README.md

---

## Prompt 3: UI Polish for Final Submission

Date: 2026-06-06

Tool: OpenAI Codex CLI

Purpose: Improve the visual design and user experience for final assignment submission.

Full Prompt Summary:
Polish the UI and user experience of ResearchLog while keeping the implemented functionality. Improve the academic dashboard style, navigation, cards, forms, badges, responsive layout, accessibility, and readability. Make the website feel clean, modern, and appropriate for academic research work. Refine the home page, dashboard, project cards, and ResearchLog branding.

Summary of Result:
Improved visual hierarchy, spacing, responsive behavior, project cards, form readability, badges, and navigation. Added a cleaner ResearchLog wordmark and application-style logo. Adjusted the dashboard so project cards summarize progress and lead to a detail/edit workflow.

Files Modified:

- index.html
- style.css
- script.js

---

## Additional Representative Prompts

Date: 2026-06-06

Tool: OpenAI Codex CLI

Purpose: Convert the app into a project-centered research workflow.

Full Prompt Summary:
Change the app so users first enter through the home page with a name or email, then access a dashboard. Make research records project-based instead of one-page sections. Let users create new projects, open project details, edit research progress, manage next tasks with due dates, and connect multiple paper notes to one project.

Summary of Result:
Implemented a local account-style entry flow, hash-based page navigation, project dashboard, project detail pages, related paper notes, task scheduling, and project history.

Files Modified:

- index.html
- style.css
- script.js

---

Date: 2026-06-06

Tool: OpenAI Codex CLI

Purpose: Add automatic progress and status calculation.

Full Prompt Summary:
Remove manual completion-rate entry and make project completion rate update automatically based on completed next-task checkboxes. Automatically set status to Planned at 0%, In Progress between 1% and 99%, and Completed at 100%.

Summary of Result:
Task completion checkboxes now drive project completion rate and status automatically. The dashboard and project detail pages display project-level progress based on task completion.

Files Modified:

- script.js
- style.css

---

## Notes

These prompts are representative examples used during AI-assisted development. Additional follow-up prompts were used for Korean UI localization, routing fixes, documentation updates, interface cleanup, sample data refinement, and final report preparation.
