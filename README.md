# WealthWise - Intelligent Finance Tracker

**WealthWise** is a modern web application designed to help users manage their personal finances effectively. It features intelligent transaction tracking, AI-powered insights, and robust user account management.

## Core Features

- **Secure User Authentication:** Email/Password based login, signup, and password recovery.
- **Interactive Dashboard:** Overview of financial health, spending patterns, and recent activity.
- **Transaction Management:** Add, edit, delete, and categorize transactions, with support for recurring entries.
- **AI-Powered Tools:**
  - Automatic transaction categorization.
  - Expense forecasting.
- **Budgeting Module:** Create and manage monthly budgets.
- **Profile Management:** View account details, change password, and export transaction data.
- **Responsive Design:** Optimized for various devices with a light/dark mode toggle.

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Component Library:** shadcn/ui
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Forms:** React Hook Form with Zod
- **AI Integration:** Genkit
- **Database:** Firebase Firestore
- **Authentication:** Firebase Authentication
- **Charting:** Recharts

## Project Setup

### 1. Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### 2. Firebase Project Setup

1.  Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Enable Authentication:** In your Firebase project, enable the "Email/Password" sign-in provider.
3.  **Enable Firestore:** Create a Firestore database. Start in **Production mode** and choose a location.
4.  **Set Firestore Security Rules:** Secure your `transactions` and `budgets` collections. Ensure only authenticated users can access their own data. Example for a collection:
    ```javascript
    match /collectionName/{docId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    ```
    Publish these rules.
5.  **Create Firestore Indexes:** The application may require composite indexes for certain queries (e.g., for transactions or budgets). Firestore will typically log an error in the browser console with a direct link to create any missing indexes if they are needed.

### 3. Environment Variables

1.  In the root of your project, create a file named `.env.local`.
2.  Add your Firebase configuration keys. These are typically prefixed with `NEXT_PUBLIC_`:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=

    # If your Genkit flows use a Google AI API key:
    # GOOGLE_API_KEY=
    ```

    Fill in the values from your Firebase project settings.

## Getting Started Locally

1.  **Clone the repository (once pushed to GitHub):**

    ```bash
    git clone https://github.com/whitebeard10/WealthWise.git
    cd WealthWise
    ```

    (Or, if you've downloaded the code, navigate to its root directory.)

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

    The application will typically be available at `http://localhost:9002`.

4.  **(Optional) Run the Genkit development server:**
    If working on AI features, run Genkit in a separate terminal:
    ```bash
    npm run genkit:dev
    ```

## Available Scripts

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the project files.
- `npm run genkit:dev`: Starts the Genkit development server.

## Folder Structure (Simplified)

```
WealthWise/
├── src/
│   ├── ai/                 # Genkit AI flows
│   ├── app/                # Next.js App Router pages & layouts
│   ├── components/         # UI components (including shadcn/ui)
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, Firebase client, type definitions
│   └── ...
├── public/                 # Static assets
├── .env.local              # Local environment variables (Git ignored)
└── ...                     # Config files (next.config.ts, tailwind.config.ts, etc.)
```

## Contact

For further understanding of the project or collaboration inquiries, please reach out:

- **[Your Name/Alias]**
- **Email:** [Mail here](mailto:avinash0chhetri@gmail.com)
- **GitHub:** [Whitebeard10](https://github.com/whitebeard10)
- **(Optional) LinkedIn/Portfolio:** [Avinash Chhetri](https://www.linkedin.com/in/avinash-chhetri/)

---

_This README provides a general overview. Specific implementation details and advanced configurations may require deeper exploration of the codebase. Contach me in case you need further calirification or assistane on this._
