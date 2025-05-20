
# WealthWise - Intelligent Finance Tracker

**WealthWise** is a modern and intuitive web application designed to help you take control of your personal finances. Track your income and expenses, categorize transactions, set budgets, manage recurring payments, and gain valuable insights into your spending habits with AI-powered forecasting.

## GitHub Repository

[https://github.com/whitebeard10/WealthWise.git](https://github.com/whitebeard10/WealthWise.git)

## Core Features

*   **User Authentication:** Secure user accounts with email/password.
    *   Login (`src/app/login/page.tsx`)
    *   Signup (`src/app/signup/page.tsx`)
    *   Forgot Password (`src/app/forgot-password/page.tsx`)
*   **Dashboard (`src/app/page.tsx`):**
    *   Financial Summary (Total Income, Total Expenses, Net Balance).
    *   Interactive Spending Patterns Chart (Bar, Pie, Line chart options).
    *   Recent Transactions list with edit/delete capabilities.
    *   Quick Actions to add transactions or view AI forecasts.
*   **Transaction Management:**
    *   Add, Edit, and Delete transactions (`src/app/transactions/add/page.tsx`, `src/app/transactions/edit/[id]/page.tsx`).
    *   AI-powered transaction categorization (`src/ai/flows/categorize-transaction.ts`).
    *   Support for marking transactions as recurring with frequency and end date.
    *   Client-side logic to auto-log past-due recurring transactions upon app load.
*   **Budgeting (`src/app/budgets/page.tsx`):**
    *   Create, view, edit, and delete monthly budgets for different categories.
*   **Expense Forecasting (`src/app/forecast/page.tsx`):**
    *   Utilizes AI (`src/ai/flows/forecast-expenses.ts`) to predict future spending based on patterns and goals.
*   **Profile Management (`src/app/profile/page.tsx`):**
    *   View account information (email, member since, user ID).
    *   Change account password (`src/app/profile/change-password/page.tsx`).
    *   Export transaction data as CSV.
    *   Logout functionality.
*   **Responsive Design:** The application is built to be accessible and usable on various devices.
*   **Light/Dark Mode Toggle:** User-selectable theme preference.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **UI Library:** React
*   **Component Library:** shadcn/ui
*   **Styling:** Tailwind CSS
*   **State Management:** React Context API
*   **Forms:** React Hook Form with Zod for validation
*   **AI Integration:** Genkit (for transaction categorization and expense forecasting)
*   **Database:** Firebase Firestore
*   **Authentication:** Firebase Authentication
*   **Charting:** Recharts

## Project Setup

### 1. Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### 2. Firebase Project Setup

1.  Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Register a Web App:** In Project settings -> General, register a web app and copy the Firebase SDK configuration object.
3.  **Enable Authentication:**
    *   Go to Authentication -> Sign-in method.
    *   Enable the "Email/Password" provider.
4.  **Enable Firestore:**
    *   Go to Firestore Database -> Create database.
    *   Start in **Production mode**.
    *   Choose a Firestore location.
5.  **Set Firestore Security Rules:**
    *   Go to Firestore Database -> Rules tab.
    *   Replace the default rules with:
        ```javascript
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /transactions/{transactionId} {
              allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
            }
            match /budgets/{budgetId} {
              allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
            }
          }
        }
        ```
    *   Click **Publish**.
6.  **Create Firestore Indexes:**
    *   The application will require composite indexes for Firestore queries. When you run the app, if an index is needed, Firestore will log an error in the browser console with a direct link to create it.
    *   **For Transactions:** An index on `userId` (ascending) and `date` (descending) is likely needed.
    *   **For Budgets:** An index on `userId` (ascending), `month` (descending), and `category` (ascending) is likely needed.
    *   Follow the links provided by Firestore in the console errors to create these indexes.

### 3. Environment Variables

1.  In the root of your project, create a file named `.env.local`.
2.  Add your Firebase configuration and any other necessary API keys:

    ```env
    # Firebase Configuration (replace with your actual values)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Genkit/Google AI API Key (if used by your Genkit flows)
    # Ensure this is set if your Genkit flows require it for Google AI models
    # GOOGLE_API_KEY=your_google_ai_api_key
    ```
    *Note: `GOOGLE_API_KEY` for Genkit flows does not need the `NEXT_PUBLIC_` prefix if only used server-side by Genkit.*

## Getting Started Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/whitebeard10/WealthWise.git
    cd WealthWise
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

4.  **(Optional) Run the Genkit development server:**
    If you are working on or testing AI features, run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    The Genkit development UI will typically be available at `http://localhost:4000`.

## Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode with Turbopack.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the project files.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.

## Folder Structure Overview

```
WealthWise/
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/
│   │   └── ...
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (auth_routes)/  # Example route group for auth pages
│   │   ├── api/            # API routes (if any)
│   │   └── ...             # Page directories (e.g., dashboard, transactions)
│   ├── components/         # Reusable UI components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React Context API providers (Auth, Transactions, Budgets)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, Firebase client setup, type definitions
│   │   ├── firebase/
│   │   └── ...
│   └── ...
├── public/                 # Static assets
├── .env.local              # Local environment variables (ignored by Git)
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Style Guidelines

WealthWise adheres to the following style guidelines:

*   **Component Library:** Utilizes `shadcn/ui` for pre-built, accessible, and customizable UI components.
*   **Styling Framework:** Tailwind CSS is used for utility-first styling. Custom global styles and theme variables are defined in `src/app/globals.css`.
*   **Consistent Visual Appearance:** The application maintains a consistent modern color palette and design language.
*   **Responsive Design Principles:** Components and layouts are designed to adapt to different screen sizes.
*   **Code Formatting:** Follows standard practices for clean and readable code (consider adding Prettier/ESLint for enforcement).
*   **Naming Conventions:** Uses clear and descriptive names for files, components, and variables.

---

