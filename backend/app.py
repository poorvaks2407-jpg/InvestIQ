
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


# Home route
@app.route("/")
def home():
    return jsonify({
        "message": "InvestIQ Backend is running!"
    })


# Get stock quote from Finnhub
def get_stock_quote(symbol):
    response = requests.get(
        f"{FINNHUB_BASE_URL}/quote",
        params={
            "symbol": symbol,
            "token": API_KEY
        },
        timeout=15
    )

    response.raise_for_status()
    data = response.json()

    if not data.get("c"):
        return None

    return {
        "symbol": symbol,
        "price": data.get("c"),
        "change": data.get("dp"),
        "high": data.get("h"),
        "low": data.get("l"),
        "open": data.get("o"),
        "previousClose": data.get("pc")
    }


# Dashboard stocks
@app.route("/api/stocks")
def get_stocks():
    if not API_KEY:
        return jsonify({
            "error": "Finnhub API key is missing"
        }), 500

    stocks = []

    try:
        for symbol in ["AAPL", "NVDA", "TSLA"]:
            stock = get_stock_quote(symbol)

            if stock:
                stocks.append(stock)

        return jsonify(stocks)

    except requests.exceptions.RequestException as error:
        print("Dashboard API Error:", error)

        return jsonify({
            "error": "Could not fetch stock data"
        }), 502


# Individual stock quote
@app.route("/api/quote")
def get_quote():
    if not API_KEY:
        return jsonify({
            "error": "Finnhub API key is missing"
        }), 500

    symbol = request.args.get("symbol", "AAPL").strip().upper()

    if not symbol:
        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    try:
        stock = get_stock_quote(symbol)

        if not stock:
            return jsonify({
                "error": "No quote data found"
            }), 404

        return jsonify(stock)

    except requests.exceptions.RequestException as error:
        print("Quote API Error:", error)

        return jsonify({
            "error": "Could not fetch stock quote"
        }), 502


# Historical stock data using Yahoo Finance
@app.route("/api/history")
def get_history():

    symbol = request.args.get("symbol", "AAPL")
    period = request.args.get("range", "1M")

    symbol = symbol.strip().upper()
    period = period.strip().upper()

    print("Requested symbol:", symbol)
    print("Requested range:", repr(period))

    ranges = {
        "1W": ("7d", "1d"),
        "1M": ("1mo", "1d"),
        "6M": ("6mo", "1d"),
        "1Y": ("1y", "1wk")
    }

    if not symbol:
        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    if period not in ranges:
        return jsonify({
            "error": "Invalid range. Use 1W, 1M, 6M, or 1Y.",
            "received_range": period,
            "available_ranges": list(ranges.keys())
        }), 400

    yahoo_period, interval = ranges[period]

    try:
        stock = yf.Ticker(symbol)

        data = stock.history(
            period=yahoo_period,
            interval=interval,
            auto_adjust=True
        )

        if data.empty:
            return jsonify({
                "error": "No historical data found for this symbol",
                "symbol": symbol
            }), 404

        history = []

        for date, row in data.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(float(row["Close"]), 2)
            })

        return jsonify({
            "symbol": symbol,
            "range": period,
            "history": history
        })

    except Exception as error:
        print("Yahoo Finance Error:", error)

        return jsonify({
            "error": "Could not fetch historical stock data",
            "details": str(error)
        }), 502


if __name__ == "__main__":
    app.run(debug=True, port=5000)
