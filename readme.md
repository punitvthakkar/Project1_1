## Product Requirements Document (PRD)

**Product Name:** CloseTheLoop
**Version:** 1.3 (Frontend & Hosting Update)
**Date:** October 26, 2023
**Product Manager:** Your Boss

---

### 1. Introduction and Goals

**1.1 Product Vision**
To create an educational web application that leverages Large Language Models (LLMs) to provide instant, high-quality, targeted feedback on student assignments, offering professors actionable, aggregated, and prescriptive insights into class-wide learning gaps. The application will be built using a secure, performant stack relying on free and open-source software (FOSS) and hosted on free, commercially secure platforms.

**1.2 Business Goals**
1. Ensure a lightweight, accessible user experience by utilizing **pure HTML/CSS/JS** for the frontend.
2. Reduce professor setup time by leveraging AI (Gemini 2.5 Flash) to automatically suggest Key Areas of Understanding (KAU) from lecture material.
3. Utilize a cost-effective development and hosting strategy by mandating **FOSS tools and free commercial hosting tiers** that meet high-security standards.

### 2. Stakeholders and User Roles

| Role | Description | Key Activities |
| :--- | :--- | :--- |
| **Professor (Admin)** | Creates sessions, defines problems/objectives (AI-assisted), views aggregate data, uses AI suggestions for future lessons. | Setup, file upload, review, class analysis, prescriptive planning. |
| **Student (End User)** | Submits assignments (documents/presentations), receives reflective AI feedback. | Submission, self-assessment, reflection. |

### 3. User Stories

*(User stories remain unchanged, as the requested updates primarily affect technology and hosting, not core user functionality.)*

| ID | User Story | Priority |
| :--- | :--- | :--- |
| P-1 | As a Professor, I want to define a specific Session ID and associated Key Areas of Understanding (KAU) so that I can easily track assignments and define evaluation criteria. | High |
| P-2 | As a Professor, I want to upload my session slides or teaching document when creating a session so the LLM can extract and **suggest KAU automatically**, streamlining my setup. | High |
| P-3 | As a Professor, I want to view a **Session Dashboard** showing aggregate class performance, highlighting the collective "DONE WELL" points and the most frequently "STILL MISSING" points. | High |
| P-4 | As a Professor, I want the system to provide **AI suggestions for what should be taught further** (remedial topics) based on the class-wide gaps identified. | High |
| S-1 | As a Student, I want to securely upload my presentation or document submission via the web app. | High |
| S-2 | As a Student, I must input the correct Session ID during upload so my submission is processed against the correct learning objectives. | High |
| S-3 | As a Student, I want to receive instant, AI-generated feedback showing **questions to reflect on** and **hints of taught frameworks** to guide my self-correction. | High |

### 4. Detailed Functional Requirements

#### 4.1 Administration & Session Management (AI-Assisted Setup)

| Requirement | Description |
| :--- | :--- |
| **FR 1.1 (Setup Upload)** | During session creation, the Professor must have the option to upload a session document. |
| **FR 1.2 (AI KAU Extraction)** | The system must use **Google Gemini 2.5 Flash** to analyze the document and extract key concepts, presenting them to the Professor as suggested KAU. |
| **FR 1.3 (KAU Finalization)** | The Professor must be able to finalize the list of KAU, including assigning categorical tags (e.g., "Communication #10"). |

#### 4.2 Student Submission & LLM Integration

| Requirement | Description |
| :--- | :--- |
| **FR 2.1** | The student interface must include a file upload mechanism compatible with common document and presentation formats. |
| **FR 2.2** | The backend must orchestrate the LLM analysis using **Google Gemini 2.5 Flash**. |
| **FR 2.3** | The LLM must generate four specific, structured outputs for every submission: Highlights, Missing Points, Reflective Questions/Hints, and Prescriptive Teaching Suggestion. |

#### 4.3 Data Storage and Aggregation

| Requirement | Description |
| :--- | :--- |
| **FR 3.1** | All LLM outputs must be captured in the database per student submission. |
| **FR 3.2** | The database structure must efficiently support aggregation of the "Missing Points" to calculate class-wide knowledge gaps. |

#### 4.4 Reporting and Dashboards

| Requirement | Description |
| :--- | :--- |
| **FR 4.1 (Student Feedback View)** | The student view must display the "Highlights (Done Well)" and "Missing Points," followed by the "Reflective Questions/Hints." |
| **FR 4.2 (Session Dashboard)** | The Professor's Dashboard must display the aggregated results, including ranked "STILL MISSING" points and **AI Suggestions for What Should Be Taught Further.** |

### 5. Non-Functional Requirements (NFRs)

| Category | Requirement |
| :--- | :--- |
| **Frontend Stack (Mandatory)** | The frontend must be built using **pure HTML, CSS, and JavaScript**. Only FOSS JavaScript libraries may be used as needed. |
| **LLM (Mandatory)** | **Google Gemini 2.5 Flash** must be used for all AI analysis tasks. |
| **Backend/DB Software (Mandatory)** | All server and database software must be **Free and Open Source Software (FOSS)**. |
| **Hosting (Mandatory)** | The backend server and database must be hosted on a **free tier of a commercially available service** known for providing **high security** (e.g., major cloud providers or secure specialized PaaS). |
| **Security** | Data must be protected with modern encryption standards (in transit and at rest). |
| **Performance** | AI feedback generation must occur rapidly (target < 60 seconds). |

### 6. Technical Specifications (Open-Source Focused)

| Component | Technology/Architecture | Constraint Details |
| :--- | :--- | :--- |
| **Frontend (Client)** | **Vanilla JavaScript, HTML5, CSS3.** | **No proprietary frameworks.** FOSS JS libraries (e.g., Axios for HTTP requests, certain visualization libs) are permitted. |
| **Backend (Server)** | Python (e.g., Flask, Django) or Node.js (e.g., Express). | **FOSS Software.** Must handle file uploads and orchestrate LLM calls. |
| **AI/LLM Interface** | Google Gemini 2.5 Flash API. | **Mandatory LLM choice.** |
| **Database** | PostgreSQL or MariaDB. | **FOSS Software.** Must be optimized for data aggregation queries. |
| **Hosting Strategy (Proposed Secure, Free Commercial Tiers)** | **Compute/Backend:** AWS Lambda Free Tier, Google Cloud Run Free Tier, or Vercel/Netlify for serverless functions, known for high security and scalability. | **Mandatory Hosting Constraint.** Must be free and commercially secure. |
| | **Database:** Supabase Free Tier, Neon Free Tier, or MongoDB Atlas Free Tier (if choosing NoSQL). | **Mandatory Hosting Constraint.** These offer secure, managed, free services. |
| | **Storage:** AWS S3 Free Tier or a similar secure cloud storage service. | Used for storing raw documents. |