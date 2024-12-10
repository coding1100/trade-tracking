How to Run

Backend Setup
    Create the database:
    mysql -u root -p < mysql_scripts/create_tables.sql

Start the backend:
    uvicorn app.main:app --reload

Frontend Setup
    Install dependencies:
    cd frontend
    npm install
    npm run dev

Access the Application
    Open http://localhost:3000 to view the frontend.
    Backend API available at http://localhost:8000.