# InvestIQ — Stock Analysis Dashboard

InvestIQ is a full-stack stock analysis application built with React and Flask. It helps users explore stock prices, track stocks through a watchlist, view historical price trends, and understand basic stock volatility.

## Features

- **Dashboard:** Stock market overview with popular stocks.
- **Stock Analysis:** Search stocks and view price information.
- **Historical Charts:** Explore historical stock prices across different time ranges.
- **Watchlist:** Add, remove, and save stocks locally.
- **Risk Assessment:** Analyze historical volatility and daily price movements.

## Tech Stack

**Frontend**
- React
- Vite
- Recharts
- CSS

**Backend**
- Python
- Flask
- Flask-CORS
- yfinance
- Finnhub API

## Project Structure

```text
InvestIQ/
├── backend/
│   └── app.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
├── .env
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd InvestIQ
```

### 2. Set up the backend

```bash
python -m venv venv
```

Install dependencies:

```bash
venv\Scripts\python.exe -m pip install flask flask-cors requests python-dotenv yfinance
```

Create a `.env` file in the project root:

```env
FINNHUB_API_KEY=your_finnhub_api_key
```

Start the backend:

```bash
venv\Scripts\python.exe backend\app.py
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite.

## Data Sources

- Finnhub API — Stock quote information.
- Yahoo Finance through yfinance — Historical stock price data.

## Notes

- Watchlist data is stored in the browser using localStorage.
- Dashboard portfolio figures and insight content are demonstration data.
- Risk assessments are based on historical price movements and are not financial advice.
- API keys must be stored in environment variables and must never be committed to GitHub.

## Future Improvements

- Deploy the application.
- Improve the dashboard with additional market information.
- Add more stock analysis capabilities.

---

**Built as a software engineering portfolio project.**