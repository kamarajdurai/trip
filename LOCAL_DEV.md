# Running Locally

To test the trip planner's interactive features (including the backend AI routes) on your computer, follow these steps:

### 1. Install Dependencies
Ensure you have all the necessary packages installed:
```bash
npm install
```

### 2. Run the Dev Server
Start the local development server:
```bash
npm run dev
```

### 3. Environment Variables
Your `.env` file is already set up with the required keys:
- `GEMINI_API_KEY`
- `WEATHER_API_KEY`
- `GOOGLE_MAPS_API_KEY`

Vite will automatically load these variables using a custom middleware.

### 4. Access the App
Once the command is running, you can access the app at the URL printed in the terminal (usually `http://localhost:5173`).

