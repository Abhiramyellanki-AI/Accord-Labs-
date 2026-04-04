# AccordLabs - AI-Powered Tender Specification Normalization

AccordLabs is an intelligent data extraction and normalization platform designed to transform unstructured technical specifications from complex tender documents into structured, machine-readable data.

---

## 🚀 Live Demo
**[Insert Deployed Link Here]**

---

## 👥 Team Information
*   **Team Name:** [Insert Team Name Here]
*   **Members:**
    *   [Member Name 1]
    *   [Member Name 2]
    *   [Member Name 3]

---

## 🎯 Problem Statement
*   **Assigned Problem / Company:** [Insert Problem Statement or Company Name Here]
*   **The Challenge:** Manually extracting and comparing technical specifications (CPU, RAM, Storage, etc.) from hundreds of pages of PDF tender documents is slow, inconsistent, and prone to human error.
*   **The Solution:** AccordLabs uses a dual-engine AI approach (Claude + Gemini) to automatically identify, clean, and standardize these specs into a unified format.

---

## 🛠️ Tech Stack Used

### **Frontend**
*   **React 18:** Modern UI library for building a responsive user interface.
*   **Vite:** Ultra-fast build tool and development server.
*   **Tailwind CSS:** Utility-first CSS framework for custom, professional styling.
*   **Lucide React:** Clean and consistent iconography.
*   **Framer Motion:** Smooth animations and transitions.

### **AI & Backend Logic**
*   **Anthropic Claude 3.5 Sonnet:** Primary high-intelligence engine for complex data normalization.
*   **Google Gemini 1.5 Flash:** High-speed fallback engine to ensure 100% uptime.
*   **@anthropic-ai/sdk & @google/genai:** Official SDKs for seamless AI integration.
*   **Exponential Backoff Logic:** Custom retry mechanism to handle API rate limits (Error 429) gracefully.

### **Deployment & DevOps**
*   **Vercel:** Automated CI/CD pipeline for production hosting.
*   **Environment Variables:** Secure management of sensitive API keys.

---

## ✨ Key Features
*   **PDF Text Extraction:** Intelligent parsing of large tender documents.
*   **Data Normalization:** Automatic removal of noise (e.g., "or better", "minimum") and unit standardization (GB/TB/GHz).
*   **Dual-Engine Fallback:** Automatically switches between Claude and Gemini to bypass rate limits.
*   **Interactive Refinement:** Chat-based feedback system to "talk" to your data and refine extraction results.
*   **Categorized Results:** Clear separation between Hardware and Software specifications.

---

## ⚙️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the root and add your keys:
    ```env
    GEMINI_API_KEY=your_gemini_key
    ANTHROPIC_API_KEY=your_anthropic_key
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

© 2024 AccordLabs | Built for [Insert Event/Hackathon Name]
