# AccordLabs - AI-Powered Tender Specification Normalization

AccordLabs is an intelligent data extraction and normalization platform designed to transform unstructured technical specifications from complex tender documents into structured, machine-readable data.

---

## 🚀 Live Demo
https://devhangout-five.vercel.app/

---

## 👥 Team Information
*   **Team Name:** [Team DevHangout]
*   **Members:**
    *   [Abhiram Yellanki]
    *   [Vibhash Naidu Lokavarapu]
    *   [Abhay Thomman Chirayil]

---

## 🎯 Problem Statement
*   **Assigned Problem / Company:** [Company Name:
                        Acceleron Labs Problem Statement:
Acceleron Labs deals extensively with government tenders that contain detailed product requirements and specifications. Currently, manually analyzing these complex 
specifications—which cover both hardware and software requirements—leads to inefficiencies and potential errors.The objective is to build a software-driven solution
to automate this process. The automated solution must be able to do the following:Targeted Extraction: Extract and identify hardware requirements (e.g., CPU, RAM, storage)
separately from software requirements (e.g., protocols, security, logs).File Handling: Process input documents that are primarily in PDF format, as well as occasional Excel
(XLS) formats.Structured Output: Organize and export all the extracted information into a structured Excel file.Adaptability: Interpret and decode different writing styles 
and representations, since requirement formats vary significantly across different documents.Technology: Utilize any LLM models or API keys (such as Google Gemini or Claude)
 to build the decoding and extraction logic.]
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
## Drive link consisting PPT and Video:




© 2024 AccordLabs | Built for [MSSPECTRA HACKATHON]
