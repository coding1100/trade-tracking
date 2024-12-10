import yfinance as yf

# Create a Ticker object for the desired stock (e.g., Apple Inc.)
ticker = yf.Ticker("AAPL")

# Fetch the historical data
history = ticker.history(period="1d")  # Fetch data for the latest day

# Get the latest closing price
latest_price = history['Close'].iloc[-1]  # 'Close' gives the closing price of the latest date

print(f"The latest price for AAPL is: ${latest_price:.2f}")
