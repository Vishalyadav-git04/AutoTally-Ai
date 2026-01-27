# AutoTally AI 🧾✨

A production-ready, AI-powered invoice automation system. It transforms PDF and image invoices into **GST-compliant, Tally-compatible XML data** using Google Gemini flash-latest Vision capabilities.


![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Gemini%20AI-green)

## 🚀 Features

* **Multimodal AI Extraction:** Uses **Gemini Vision** to "read" invoices like a human, ensuring 100% accuracy on table structures and layout.
* **Multi-Session Workflow:** Upload multiple invoices in one session and switch between them instantly via the sidebar history.
* **Tally Integration:** Auto-generates `import.xml` files compatible with Tally Prime and Tally ERP 9.
* **Smart Validation:**
    * Verifies GSTIN formats.
    * Checks mathematical consistency (Subtotal + Tax = Total).
* **Modern UI:** Dark-themed, glassmorphism dashboard built with React + Tailwind CSS.
* **Format Support:** PDF, JPG, PNG, PNG.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Axios.
* **Backend:** Node.js, Express.js, Multer (File Handling).
* **AI Engine:** Google Gemini API (Generative AI SDK).
* **Validation:** Zod (Schema validation).
* **XML Generation:** xmlbuilder2.

## 📂 Project Structure

```text
/invoice-automation
  ├── /client (Frontend)
  │     ├── /src
  │     │    ├── /components/ui   # Reusable UI cards
  │     │    ├── /lib             # Utility functions (cn, etc.)
  │     │    ├── App.jsx          # Main Dashboard Logic
  │     │    └── main.jsx         # Entry point
  │     └── tailwind.config.js
  │
  ├── /server (Backend)
  │     ├── /src
  │     │    ├── /config          # Env variables
  │     │    ├── /controllers     # API Request Handlers
  │     │    ├── /services        # AI & XML Logic
  │     │    └── /utils           # Helpers
  │     ├── app.js                # Server Entry Point
  │     └── .env                  # API Keys
  │
  └── README.md
  ```
## ⚙️ Installation & Setup
## 1. Prerequisites
    Node.js (v18 or higher)

    A Google Gemini API Key (Get it from Google AI Studio)

## 2. Backend Setup
    Bash
    cd server
    npm install
    Create a .env file in the server folder:

    Code snippet
    PORT=5000
    GEMINI_API_KEY=your_actual_api_key_here
## 3. Frontend Setup
    Bash
    cd client
    npm install
    🏃‍♂️ Running the Application
## Option A: Run Separately (Two Terminals)

    Terminal 1 (Backend):

    Bash
    cd server
    node app.js

    Terminal 2 (Frontend):
    Bash
    cd client
    npm run dev
## Option B: Run Concurrently (One Command) If you have concurrently installed in the root:

    Bash
    npm start
    📖 How to Use
    Open the App: Navigate to http://localhost:5173.

>Upload Invoice: Click "New Invoice" or drag & drop a PDF/Image.

>Wait for AI: The system converts the file to Base64 and sends it to Gemini for visual analysis.

>Review Data: Check the extracted fields and line items in the dashboard.

## Download:

    Click JSON for raw data.

    Click Tally XML to get the file ready for import into Tally.

## 🐛 Troubleshooting
Error: "404 Model Not Found":

Your API Key might be in an old Google Cloud Project. Create a new API key in a new project via Google AI Studio.

Check server/src/config/env.js and ensure GEMINI_MODEL is set to 'gemini-flash-latest' .

Error: "429 Too Many Requests":

You hit the free tier limit (15 RPM). Wait a minute and try again.

UI looks broken (White screen):

Ensure Tailwind directives are present in client/src/index.css.

Restart the frontend server (npm run dev) to reload the Tailwind config.

## 📄 License
MIT License. Free for educational and personal use.