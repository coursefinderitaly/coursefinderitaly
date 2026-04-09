# Project Memory & Objective Plan

## Refactored User Request
"Please merge the current separate messaging options for 'Admin Team' and 'Student' into a single, unified chat interface. This chat interface should be accessible across the Admin, Partner, and Counsellor portals, enabling them to send messages to a specific student directly within the student's profile. These messages must be categorized separately by the program and the university the student is applying to. On the student side, these messages should appear in a corresponding chat inbox. 
Additionally, implement a new feature for student registration: whenever an Admin, Partner, or Counsellor registers a new student, the system should automatically create a portal account for that student. During this registration process, the system should ask the Admin/Partner/Counsellor to assign an initial password for the student."

## Work Delegation Plan (4 Agents)

### Agent 1: Database & Data Modeling (DB Architect)
**Focus:** Schema updates and database integrity.
*   **Tasks:**
    *   Design a unified `Message` or `Chat` schema that associates messages with a specific `studentId`, `programId`, `universityId`, and the `senderId`.
    *   Update the `User` or `Student` schema to ensure it supports account auto-creation (e.g., handling `password` hashing when an account is created by a third party).
    *   Update existing schemas to remove redundant chat structures if they were split between "admin team" and "student" previously.

### Agent 2: Backend API Integration (Backend Dev)
**Focus:** Server-side logic and API REST operations.
*   **Tasks:**
    *   Refactor/Create endpoints to handle sending and retrieving chat messages, applying filters for student, program, and university.
    *   Update the `registerStudent` API endpoint (used by staff) to accept a password payload, hash it, and auto-provision the student account so they can log in immediately.
    *   Set up any backend broadcasting logic (like Socket.io) if real-time chat updates are requested later.

### Agent 3: Staff Portals Frontend (Admin/Partner/Counsellor UI)
**Focus:** Interface components for staff dashboards.
*   **Tasks:**
    *   Build a unified "Chatbox" UI inside the staff view of a student's profile.
    *   Add dropdowns or tab selectors to the chatbox so staff can send messages under a specific Program and University context.
    *   Update the "Add Student" or "Register Student" form in staff portals to include an "Assign Password" input field, passing this to the backend.

### Agent 4: Student Portal Frontend (Student UI)
**Focus:** Interface components for the student dashboard.
*   **Tasks:**
    *   Build the matching unified "Chatbox" UI inside the Student Portal.
    *   Organize the chat history visually so students can tell which messages belong to which Program and University.
    *   Allow students to seamlessly reply back to staff from this interface.
