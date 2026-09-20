# Campus Lost & Found - Software Engineering Micro-Project

A centralized, responsive web application designed for university and college campuses allowing students and staff to report lost and found items, browse listings, search and filter belongings dynamically, and manage listings through their complete lifecycle.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Project Objectives](#project-objectives)
4. [Software Engineering Modules](#software-engineering-modules)
5. [System Architecture](#system-architecture)
6. [Data Flow Diagrams (DFD)](#data-flow-diagrams-dfd)
7. [Use Case Analysis & Requirements](#use-case-analysis--requirements)
8. [Technologies Used](#technologies-used)
9. [System & Software Requirements](#system--software-requirements)
10. [Folder Structure](#folder-structure)
11. [How the System Works](#how-the-system-works)
    - [How JSON Storage Works](#how-json-storage-works)
    - [Client-Server Communication Lifecycle](#client-server-communication-lifecycle)
12. [Installation & Execution Guide](#installation--execution-guide)
13. [RESTful API Endpoints](#restful-api-endpoints)
14. [Test Cases & Results](#test-cases--results)
15. [Viva Voce Questions & Answers](#viva-voce-questions--answers)
16. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

On any busy college campus, students routinely misplace valuable personal and academic items such as wallets, college ID smart cards, calculators, laptops, earphones, and notebooks. Traditional campus lost-and-found methods rely on fragmented WhatsApp/Telegram groups, physical noticeboards, or inquiries at individual security desks.

**Campus Lost & Found** provides a single, unified digital portal where any student can:
- Immediately register a lost item with identifying proofs.
- Post details of found belongings to help locate their owners.
- Search and filter records in real-time.
- Mark recovered items as **Resolved**.
- Edit or delete listings without requiring complex database configurations.

---

## 2. Problem Statement

1. **Information Fragmentation:** Missing items are posted across disparate informal social media channels with limited reach.
2. **Delayed Recovery:** Misplaced ID cards and lab notebooks often remain unclaimed for weeks because finders do not know whom to contact.
3. **No Verification Proof:** Informal posts lack structured fields for verification, causing confusion over rightful ownership.
4. **Lack of Lifecycle Tracking:** Once an item is found, informal posts are rarely updated or marked resolved, leading to wasted inquiries.

---

## 3. Project Objectives

- **Centralization:** Provide a single web-accessible repository for all campus lost and found reports.
- **Simplicity:** Build a zero-database, beginner-friendly system using Python Flask and JSON flat-file storage suitable for 3rd-semester CSE coursework.
- **Dynamic Interactions:** Deliver instantaneous, reactive search, combined filtering, and dynamic dashboard counters using client-side vanilla JavaScript and the Fetch API.
- **Structured Data:** Maintain uniform records with item category, location, date, description, and identifying proof.
- **Accountability:** Allow reporters to edit listings, mark items as resolved, or remove them when claimed.

---

## 4. Software Engineering Modules

The project is structured into 7 distinct, cohesive modules:

```
┌─────────────────────────────────────────────────────────────┐
│                 CAMPUS LOST & FOUND SYSTEM                  │
├──────────────────────────────┬──────────────────────────────┤
│ 1. User Interface Module     │ 2. Lost Item Module          │
│ 3. Found Item Module         │ 4. Search & Filter Module    │
│ 5. Listing Management Module │ 6. Backend / REST API Module │
│ 7. JSON Data Storage Module  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

1. **User Interface Module (`templates/index.html`, `static/style.css`):**
   - Renders the responsive dashboard, hero banner, statistics cards, listing cards grid, and modal dialogs.
   - Provides visual badges (`LOST`, `FOUND`, `ACTIVE`, `RESOLVED`) and toast notifications.

2. **Lost Item Reporting Module (`static/script.js`, `app.py`):**
   - Captures item name, category, loss location, date, identifying proof, student name, and contact details.
   - Executes client-side validation before sending an asynchronous `POST` request.

3. **Found Item Reporting Module (`static/script.js`, `app.py`):**
   - Captures found item characteristics, location found, date, identifying details, finder name, and contact info.
   - Writes the new record to `items.json` with an auto-incrementing ID.

4. **Search and Filter Module (`static/script.js`):**
   - Performs real-time multi-attribute search across item name, category, location, and description.
   - Enables simultaneous combining of Type (`Lost` / `Found`), Category, and Status (`Active` / `Resolved`) filters.

5. **Listing Management Module (`static/script.js`, `app.py`):**
   - Displays full item specifications in an Item Details modal.
   - Allows inline editing (`PUT /api/items/<id>`).
   - Allows marking an item as resolved (`PUT /api/items/<id>/resolve`).
   - Confirms and processes deletion (`DELETE /api/items/<id>`).

6. **Backend / API Module (`app.py`):**
   - Routes incoming HTTP requests to corresponding controller functions.
   - Validates incoming payloads and returns uniform JSON responses with proper HTTP status codes (`200`, `201`, `400`, `404`, `500`).

7. **JSON Data Management Module (`items.json`):**
   - Manages non-volatile file I/O operations (`load_items()` and `save_items()`).
   - Guarantees data durability without requiring external database server processes.

---

## 5. System Architecture

The application adopts a **Client-Server 3-Tier Architecture** utilizing REST principles:

```
+------------------------------------------------------------------+
|                    PRESENTATION TIER (Browser)                   |
|  - HTML5 Document Object Model (DOM)                             |
|  - Vanilla CSS3 Modern Styling (Responsive Grid, Badges, Modals) |
|  - Vanilla JavaScript ES6 (Fetch API, Input Validation, Filters) |
+---------------------------------+--------------------------------+
                                  │ HTTP Requests (JSON)
                                  │ Fetch API (GET, POST, PUT, DELETE)
                                  ▼
+------------------------------------------------------------------+
|                     APPLICATION TIER (Flask)                     |
|  - Flask WSGI Microframework (app.py)                            |
|  - URL Routing & REST API Endpoints                              |
|  - Request Body Validation & Error Handling                      |
|  - Business Logic (Status toggle, ID assignment)                 |
+---------------------------------+--------------------------------+
                                  │ File Read / Write (UTF-8)
                                  │ json.load() / json.dump()
                                  ▼
+------------------------------------------------------------------+
|                        DATA TIER (Storage)                       |
|  - Flat File: items.json                                         |
|  - Serialized Array of JSON Item Records                         |
+------------------------------------------------------------------+
```

---

## 6. Data Flow Diagrams (DFD)

### Level 0 DFD (Context Diagram)

```
                     ┌──────────────────┐
                     │                  │
                     │  College Student │
                     │  / Campus Finder │
                     │                  │
                     └────────┬─────────┘
                              │
               Item Details / │ ▲  Listing Cards / Search Results /
              Filter Criteria │ │  Confirmation Toasts
                              ▼ │
                     ┌──────────────────┐
                     │      [0.0]       │
                     │   Campus Lost    │
                     │    & Found       │
                     │     System       │
                     └────────┬─────────┘
                              │
             Serialize Record │ ▲ Read All Records
                              ▼ │
                     ┌──────────────────┐
                     │ (D1) items.json  │
                     └──────────────────┘
```

### Level 1 DFD (Decomposed Processes)

```
 [Student] ──(1. Submit Lost/Found Data)──> [Process 1.0: Validate Form Input]
                                                      │
                                          (Validated JSON Payload)
                                                      │
                                                      ▼
 [Student] <──(Success / Error Toast)──── [Process 2.0: Process API Request]
                                                      │
                                             (Write Record / Read Data)
                                                      ▼
                                             ┌──────────────────┐
                                             │ (D1) items.json  │
                                             └────────┬─────────┘
                                                      │
                                                 (Raw Items)
                                                      ▼
 [Student] <──(Rendered Cards & Stats)─── [Process 3.0: Search & Filter Logic]
```

---

## 7. Use Case Analysis & Requirements

### Functional Requirements

- **FR1:** The system shall display all recorded lost and found listings upon launch.
- **FR2:** The system shall allow students to submit a lost item report with mandatory validation.
- **FR3:** The system shall allow finders to submit a found item report.
- **FR4:** The system shall provide real-time search across item name, category, location, and description.
- **FR5:** The system shall allow combining Type, Category, and Status filters simultaneously.
- **FR6:** The system shall provide a detailed modal view with identifying proof and contact details.
- **FR7:** The system shall allow users to edit existing listings and persist updates.
- **FR8:** The system shall allow deletion of listings with confirmation.
- **FR9:** The system shall allow any active item to be toggled to "Resolved".
- **FR10:** The system shall calculate and display live summary statistics (Total, Lost, Found, Resolved).

### Non-Functional Requirements

- **Usability:** Intuitive, card-based interface requiring zero technical training.
- **Performance:** Instantaneous client-side filtering without page reloads.
- **Portability:** Self-contained without requiring database server setup (MySQL/PostgreSQL/MongoDB).
- **Reliability:** Graceful handling of corrupted or missing `items.json` files.
- **Input Integrity:** Client and server-side validation against empty or malformed fields.

---

## 8. Technologies Used

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Markup** | **HTML5** | Semantic structure (`<header>`, `<main>`, `<section>`, `<article>`, `<dialog>`). |
| **Frontend Styling** | **Vanilla CSS3** | Custom properties (variables), Flexbox, CSS Grid, mobile media queries. |
| **Frontend Logic** | **Vanilla JavaScript (ES6)** | Native `fetch()`, DOM manipulation, event-driven search & filtering. |
| **Backend Framework** | **Python Flask** | Lightweight WSGI microframework, simple routing, readable for viva. |
| **Data Persistence** | **JSON Flat File (`items.json`)** | Human-readable, structured, requires no DBMS installation or SQL setup. |

---

## 9. System & Software Requirements

### Hardware Requirements
- **Processor:** Intel Core i3 / AMD Ryzen 3 or equivalent.
- **RAM:** Minimum 2 GB (4 GB recommended).
- **Disk Space:** 50 MB free space.

### Software Requirements
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Python:** Python 3.8 or higher.
- **Web Browser:** Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari.

---

## 10. Folder Structure

```
campus-lost-found/
│
├── app.py                  # Flask backend server, routes & JSON handlers
├── items.json              # Persistent data store (preloaded with sample data)
├── requirements.txt        # Python dependency manifest (Flask)
├── README.md               # Complete project documentation & viva guide
│
├── templates/
│   └── index.html          # Semantic single-page HTML template
│
└── static/
    ├── style.css           # Modern, responsive campus styling
    └── script.js           # Client-side validation, Fetch API, live search & filter
```

---

## 11. How the System Works

### How JSON Storage Works
Instead of maintaining a complex relational database with database tables, columns, and foreign keys, all listings are stored as a JSON array of objects inside `items.json`.

- When an item is added, `app.py` reads `items.json` using Python's built-in `json.load()`, appends the new record with an incremented ID, and writes back using `json.dump(..., indent=2)`.
- Because file writes are executed with standard UTF-8 encoding and formatting, `items.json` remains completely human-readable and inspectable in any text editor.

### Client-Server Communication Lifecycle

```
[ User Action: Types Search Query or Clicks 'Submit' ]
                          │
                          ▼
             [ JavaScript Event Listener ]
                          │
                          ▼
        [ JavaScript Input Validation Logic ]
                          │
                          ▼
            [ Native fetch() API Call ]
   (Sends HTTP POST / GET / PUT / DELETE with JSON Body)
                          │
                          ▼
         [ Flask Route in app.py Handles Request ]
                          │
                          ▼
     [ Read / Update items.json using json.dump ]
                          │
                          ▼
   [ Flask returns jsonify({'success': True, ...}) ]
                          │
                          ▼
     [ JavaScript receives Response Object in Promise ]
                          │
                          ▼
[ DOM is dynamically updated & Toast notification shown ]
```

---

## 12. Installation & Execution Guide

### Step 1: Open Terminal / Command Prompt
Navigate to the project directory:
```bash
cd "C:\Users\adrie\.gemini\antigravity-ide\scratch\campus-lost-found"
```

### Step 2: Install Dependencies
Install Flask from `requirements.txt`:
```bash
python -m pip install -r requirements.txt
```

### Step 3: Run the Flask Server
Start the development server:
```bash
python app.py
```

### Step 4: Open in Your Browser
Open any modern web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 13. RESTful API Endpoints

| HTTP Method | Route | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves main HTML webpage | None | `200 OK` |
| `GET` | `/api/items` | Retrieves all listings | None | `200 OK` |
| `GET` | `/api/items/<id>` | Retrieves details of single item | None | `200 OK` / `404 Not Found` |
| `POST` | `/api/items` | Creates a new lost or found listing | JSON item payload | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/items/<id>` | Updates an existing listing | JSON updated fields | `200 OK` / `404 Not Found` |
| `PUT` | `/api/items/<id>/resolve` | Marks item status as "Resolved" | None | `200 OK` / `404 Not Found` |
| `DELETE`| `/api/items/<id>` | Removes listing from `items.json` | None | `200 OK` / `404 Not Found` |

---

## 14. Test Cases & Results

| Test ID | Test Scenario | Input Data | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | View default listings on page load | Initial application startup | Pre-loaded 6 sample items rendered with correct badges and counts | **PASS** |
| **TC02** | Report lost item with valid data | Item: "Scientific Calculator", Cat: "Electronics", Loc: "Lab 2" | Item saved to `items.json`, ID assigned, card appears immediately | **PASS** |
| **TC03** | Form validation on empty fields | Submit empty form | Error message under empty fields, submission halted | **PASS** |
| **TC04** | Future date validation | Date: Tomorrow's date | Error: "Date cannot be in the future." | **PASS** |
| **TC05** | Real-time search query | Search: "wallet" | Displays only cards containing "wallet" | **PASS** |
| **TC06** | Combined filter execution | Type: "Lost", Category: "Electronics" | Displays only lost electronic items | **PASS** |
| **TC07** | Mark item as resolved | Click "✓ Resolve" on active item | Status updates to "Resolved", resolve button disappears, stat updates | **PASS** |
| **TC08** | Edit existing listing | Change location to "Library 3rd Floor" | Listing card and details modal update with new location | **PASS** |
| **TC09** | Delete listing with confirmation | Click Delete, confirm dialog | Item removed from `items.json`, card removed from UI | **PASS** |
| **TC10** | Delete non-existent ID | `DELETE /api/items/9999` | Server returns HTTP 404 with error message | **PASS** |

---

## 15. Viva Voce Questions & Answers

### Q1: What is the role of Flask in this project?
> **Answer:** Flask acts as the backend Web Server Gateway Interface (WSGI) application. It serves the HTML template and exposes RESTful API endpoints (`/api/items`) that handle incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`), perform validation, and execute file operations on `items.json`.

### Q2: Why did you use JSON storage instead of MySQL or SQLite?
> **Answer:** For a college micro-project, JSON storage keeps the application lightweight, fully portable, and zero-configuration. Anyone can run the project on any computer with only Python installed, without having to configure database services, credentials, or table schemas.

### Q3: How does the frontend communicate with Flask without reloading the page?
> **Answer:** We use the modern JavaScript **Fetch API**. It sends asynchronous HTTP requests in the background. When the server responds with a JSON payload, JavaScript dynamically modifies the Document Object Model (DOM) to display new cards, update statistics, or show toast notifications.

### Q4: How is data integrity maintained in `items.json`?
> **Answer:** In `app.py`, the `load_items()` and `save_items()` helper functions encapsulate all file I/O. If the file is missing or contains invalid syntax, `load_items()` returns an empty list rather than crashing. All writes overwrite cleanly using `json.dump()` with atomic file writes.

### Q5: How do the combined search and filters work?
> **Answer:** In `static/script.js`, the `applyFiltersAndRender()` function checks every item against four conditions:
1. Does the item type match the selected dropdown (`all`, `lost`, or `found`)?
2. Does the item category match the selected dropdown?
3. Does the item status match (`all`, `Active`, or `Resolved`)?
4. Does the text search query appear in the item's name, description, location, or category?
Only items satisfying all active conditions are rendered into the DOM.

---

## 16. Future Enhancements

1. **Image Uploads:** Allow users to upload a photo of the lost or found item.
2. **Campus Single Sign-On (SSO):** Authenticate students using institutional Google Workspace accounts.
3. **Automated Matching Algorithm:** Suggest potential matches between recently reported lost items and newly reported found items based on keyword similarity.
4. **Email / SMS Notifications:** Automatically alert reporters when an item matching their description is logged.
