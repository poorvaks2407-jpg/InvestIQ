
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import './App.css'

// ==========================================
// RISK ASSESSMENT COMPONENT
// ==========================================

function RiskAssessment() {
  const [symbol, setSymbol] = useState('')
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyzeRisk = async (event) => {
    event.preventDefault()

    const stockSymbol = symbol.trim().toUpperCase()

    if (!stockSymbol) {
      setError('Please enter a stock symbol')
      return
    }

    setLoading(true)
    setError('')
    setRiskData(null)

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/history?symbol=${encodeURIComponent(stockSymbol)}&range=6M`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch historical prices')
      }

      if (!data.history || data.history.length < 3) {
        throw new Error('Not enough historical data to calculate risk')
      }

      // Calculate daily percentage returns
      const returns = []

      for (let i = 1; i < data.history.length; i++) {
        const previousPrice = Number(data.history[i - 1].price)
        const currentPrice = Number(data.history[i].price)

        if (
          Number.isFinite(previousPrice) &&
          Number.isFinite(currentPrice) &&
          previousPrice > 0
        ) {
          returns.push(
            ((currentPrice - previousPrice) / previousPrice) * 100
          )
        }
      }

      if (returns.length < 2) {
        throw new Error('Not enough valid price changes to calculate risk')
      }

      // Calculate average daily return
      const average =
        returns.reduce((total, value) => total + value, 0) /
        returns.length

      // Calculate sample variance
      const variance =
        returns.reduce(
          (total, value) => total + Math.pow(value - average, 2),
          0
        ) / (returns.length - 1)

      // Standard deviation of daily returns
      const dailyVolatility = Math.sqrt(variance)

      // Annualized volatility: daily volatility × square root of 252 trading days
      const annualizedVolatility = dailyVolatility * Math.sqrt(252)

      // Average absolute daily movement
      const averageMovement =
        returns.reduce((total, value) => total + Math.abs(value), 0) /
        returns.length

      // Largest absolute daily movement
      const largestMovement = Math.max(
        ...returns.map((value) => Math.abs(value))
      )

      // Simple risk classification
      let riskLevel = 'Low'
      let riskDescription =
        'The stock has shown relatively lower historical price fluctuations.'

      if (annualizedVolatility >= 35) {
        riskLevel = 'High'
        riskDescription =
          'The stock has shown larger historical price fluctuations.'
      } else if (annualizedVolatility >= 20) {
        riskLevel = 'Moderate'
        riskDescription =
          'The stock has shown noticeable historical price fluctuations.'
      }

      setRiskData({
        symbol: stockSymbol,
        volatility: annualizedVolatility,
        averageMovement,
        largestMovement,
        riskLevel,
        riskDescription,
        sessions: returns.length
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel risk-panel">
      <div className="panel-heading">
        <div>
          <h3>Stock Risk Assessment</h3>
          <p>Understand historical stock price volatility</p>
        </div>
        <span className="ai-icon">◈</span>
      </div>

      <form onSubmit={analyzeRisk}>
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter stock symbol (e.g. AAPL)"
            value={symbol}
            onChange={(event) =>
              setSymbol(event.target.value.toUpperCase())
            }
          />

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Risk'}
          </button>
        </div>
      </form>

      {error && <p className="negative risk-error">{error}</p>}

      {loading && (
        <p className="muted risk-message">
          Analyzing historical price movements...
        </p>
      )}

      {!riskData && !loading && !error && (
        <div className="risk-empty">
          <div className="watchlist-empty-icon">◈</div>
          <h3>Analyze a stock's risk</h3>
          <p>
            Enter a stock symbol to calculate its historical volatility
            and risk level.
          </p>
        </div>
      )}

      {riskData && (
        <div className="risk-results">
          <div className="risk-overview">
            <div>
              <p className="risk-label">RISK REPORT</p>
              <h2>{riskData.symbol}</h2>
              <p>{riskData.riskDescription}</p>
            </div>

            <div className={`risk-badge ${riskData.riskLevel.toLowerCase()}`}>
              {riskData.riskLevel} Risk
            </div>
          </div>

          <div className="risk-stats">
            <div className="risk-stat-card">
              <p>Annualized Volatility</p>
              <h2>{riskData.volatility.toFixed(2)}%</h2>
              <small>Estimated yearly price variation</small>
            </div>

            <div className="risk-stat-card">
              <p>Average Daily Movement</p>
              <h2>{riskData.averageMovement.toFixed(2)}%</h2>
              <small>Average absolute daily change</small>
            </div>

            <div className="risk-stat-card">
              <p>Largest Daily Movement</p>
              <h2>{riskData.largestMovement.toFixed(2)}%</h2>
              <small>Largest absolute daily change</small>
            </div>
          </div>

          <div className="risk-details">
            <h3>Risk Analysis</h3>

            <div className="risk-meter">
              <div className="risk-meter-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>

              <div className="risk-meter-track">
                <div
                  className={`risk-meter-fill ${riskData.riskLevel.toLowerCase()}`}
                  style={{
                    width: `${Math.min(
                      (riskData.volatility / 50) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <p className="muted">
              Calculated using {riskData.sessions} daily price changes
              from approximately six months of historical data.
            </p>
          </div>

          <p className="risk-disclaimer">
            Risk levels are simplified indicators based on historical
            volatility. They do not predict future performance or guarantee
            investment safety.
          </p>
        </div>
      )}
    </section>
  )
}

// ==========================================
// MAIN INVESTIQ APPLICATION
// ==========================================

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  // Dashboard states
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stock Analysis states
  const [searchSymbol, setSearchSymbol] = useState('')
  const [selectedStock, setSelectedStock] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Historical chart states
  const [history, setHistory] = useState([])
  const [historyRange, setHistoryRange] = useState('1M')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // Watchlist states
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('investiq-watchlist')) || []
    } catch {
      return []
    }
  })

  const [watchlistSymbol, setWatchlistSymbol] = useState('')
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlistError, setWatchlistError] = useState('')

  // Save Watchlist to browser storage
  useEffect(() => {
    localStorage.setItem('investiq-watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Refresh saved Watchlist prices when app loads
  useEffect(() => {
    let ignore = false

    const refreshWatchlist = async () => {
      if (watchlist.length === 0) return

      const updatedStocks = await Promise.all(
        watchlist.map(async (stock) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:5000/api/quote?symbol=${encodeURIComponent(stock.symbol)}`
            )

            if (!response.ok) return stock

            return await response.json()
          } catch {
            return stock
          }
        })
      )

      if (!ignore) {
        setWatchlist(updatedStocks)
      }
    }

    refreshWatchlist()

    return () => {
      ignore = true
    }
  }, [])

  // Fetch popular stocks for Dashboard
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/stocks')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch stock data')
        }
        return response.json()
      })
      .then((data) => {
        setStocks(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Search for an individual stock
  const handleStockSearch = async (event) => {
    event.preventDefault()

    if (!searchSymbol.trim()) {
      setSearchError('Please enter a stock symbol')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    setSelectedStock(null)
    setHistory([])
    setHistoryError('')

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/quote?symbol=${encodeURIComponent(searchSymbol.trim())}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to find stock')
      }

      setSelectedStock(data)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }

  // Add stock to Watchlist
  const handleAddToWatchlist = async (event) => {
    event.preventDefault()

    const symbol = watchlistSymbol.trim().toUpperCase()

    if (!symbol) {
      setWatchlistError('Please enter a stock symbol')
      return
    }

    if (watchlist.some((stock) => stock.symbol === symbol)) {
      setWatchlistError('This stock is already in your watchlist')
      return
    }

    setWatchlistLoading(true)
    setWatchlistError('')

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/quote?symbol=${encodeURIComponent(symbol)}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to find this stock')
      }

      setWatchlist((current) => [...current, data])
      setWatchlistSymbol('')
    } catch (err) {
      setWatchlistError(err.message)
    } finally {
      setWatchlistLoading(false)
    }
  }

  // Remove stock from Watchlist
  const handleRemoveFromWatchlist = (symbol) => {
    setWatchlist((current) =>
      current.filter((stock) => stock.symbol !== symbol)
    )
  }

  // Fetch historical stock prices
  useEffect(() => {
    if (!selectedStock) {
      setHistory([])
      return
    }

    let ignore = false

    const fetchHistory = async () => {
      setHistoryLoading(true)
      setHistoryError('')
      setHistory([])

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/history?symbol=${encodeURIComponent(selectedStock.symbol)}&range=${historyRange}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Could not load historical data')
        }

        if (!ignore) {
          setHistory(data.history)
        }
      } catch (err) {
        if (!ignore) {
          setHistoryError(err.message)
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      ignore = true
    }
  }, [selectedStock, historyRange])

  // Sidebar menu
  const menu = [
    { name: 'Dashboard', icon: '⌂' },
    { name: 'Stock Analysis', icon: '▥' },
    { name: 'AI Insights', icon: '✧' },
    { name: 'Risk Assessment', icon: '◈' },
    { name: 'Watchlist', icon: '☆' }
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">I</div>
          <span>
            Invest<span className="brand-highlight">IQ</span>
          </span>
        </div>

        <p className="menu-label">MENU</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => setActiveTab(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">P</div>
            <div>
              <strong>My Account</strong>
              <small>Investor</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="greeting">WELCOME BACK</p>
            <h1>{activeTab}</h1>
          </div>

          <div className="topbar-right">
            <span className="market-status">
              <span className="status-dot"></span>
              Market Open
            </span>
            <button className="notification">♧</button>
            <div className="avatar">P</div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activeTab === 'Dashboard' ? (
          <>
            <section className="welcome">
              <div>
                <p className="welcome-label">YOUR FINANCIAL OVERVIEW</p>
                <h2>Make smarter investment decisions.</h2>
                <p>
                  Track markets, understand risks, and explore AI-powered
                  insights.
                </p>
              </div>
              <div className="welcome-icon">✧</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <p>Total Portfolio Value</p>
                <h2>$24,580.50</h2>
                <span className="positive">↗ 8.24% this month</span>
              </div>

              <div className="stat-card">
                <p>Total Investment</p>
                <h2>$20,000.00</h2>
                <span className="muted">Initial investment</span>
              </div>

              <div className="stat-card">
                <p>Total Returns</p>
                <h2 className="green">$4,580.50</h2>
                <span className="positive">↗ 22.90% overall</span>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel portfolio-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Portfolio Performance</h3>
                    <p>Track your investment growth</p>
                  </div>

                  <select defaultValue="7D">
                    <option>7D</option>
                    <option>1M</option>
                    <option>6M</option>
                    <option>1Y</option>
                  </select>
                </div>

                <div className="chart-value">$24,580.50</div>
                <span className="positive">↗ 8.24% (+$1,870.20)</span>

                <div className="chart">
                  <div className="chart-lines">
                    <span>$25k</span>
                    <span>$20k</span>
                    <span>$15k</span>
                    <span>$10k</span>
                  </div>

                  <svg viewBox="0 0 600 190" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#36d399" stopOpacity=".3" />
                        <stop offset="100%" stopColor="#36d399" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 150 L55 130 L110 142 L165 95 L220 112 L275 70 L330 88 L385 45 L440 62 L495 25 L550 40 L600 8 L600 190 L0 190 Z"
                      fill="url(#area)"
                    />

                    <path
                      d="M0 150 L55 130 L110 142 L165 95 L220 112 L275 70 L330 88 L385 45 L440 62 L495 25 L550 40 L600 8"
                      fill="none"
                      stroke="#36d399"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="chart-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>AI Market Insight</h3>
                    <p>Intelligent market overview</p>
                  </div>
                  <span className="ai-icon">✧</span>
                </div>

                <div className="insight">
                  <span className="insight-tag">MARKET SUMMARY</span>
                  <h3>Market sentiment is positive</h3>
                  <p>
                    Technology stocks are showing positive momentum.
                    Monitor market volatility before making investment
                    decisions.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActiveTab('AI Insights')}
                >
                  Explore AI Insights →
                </button>
              </div>
            </section>

            <section className="panel stocks-panel">
              <div className="panel-heading">
                <div>
                  <h3>Popular Stocks</h3>
                  <p>Market snapshot</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActiveTab('Stock Analysis')}
                >
                  View all →
                </button>
              </div>

              <div className="stock-list">
                {loading && <p>Loading stocks...</p>}
                {error && <p className="negative">{error}</p>}

                {!loading && !error && stocks.map((stock) => (
                  <div className="stock-row" key={stock.symbol}>
                    <div className="stock-symbol">
                      {stock.symbol.slice(0, 1)}
                    </div>

                    <div className="stock-name">
                      <strong>{stock.name || stock.symbol}</strong>
                      <small>{stock.symbol}</small>
                    </div>

                    <strong>${Number(stock.price).toFixed(2)}</strong>

                    <span className={stock.change >= 0 ? 'positive' : 'negative'}>
                      {stock.change > 0 ? '+' : ''}
                      {Number(stock.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>

        ) : activeTab === 'Stock Analysis' ? (

          /* STOCK ANALYSIS */
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Stock Analysis</h3>
                <p>Search and explore individual stocks</p>
              </div>
            </div>

            <form onSubmit={handleStockSearch}>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g. AAPL)"
                  value={searchSymbol}
                  onChange={(event) =>
                    setSearchSymbol(event.target.value.toUpperCase())
                  }
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Searching...' : 'Search Stock'}
                </button>
              </div>
            </form>

            {searchError && <p className="negative">{searchError}</p>}

            {selectedStock && (
              <div className="stock-analysis-result">
                <div className="panel-heading">
                  <div>
                    <h2>{selectedStock.symbol}</h2>
                    <p>Stock market overview</p>
                  </div>
                  <h2>${Number(selectedStock.price).toFixed(2)}</h2>
                </div>

                <p className={selectedStock.change >= 0 ? 'positive' : 'negative'}>
                  {selectedStock.change > 0 ? '+' : ''}
                  {Number(selectedStock.change).toFixed(2)}% today
                </p>

                <div className="stats-grid">
                  <div className="stat-card">
                    <p>Day High</p>
                    <h2>${Number(selectedStock.high).toFixed(2)}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Day Low</p>
                    <h2>${Number(selectedStock.low).toFixed(2)}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Opening Price</p>
                    <h2>${Number(selectedStock.open).toFixed(2)}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Previous Close</p>
                    <h2>${Number(selectedStock.previousClose).toFixed(2)}</h2>
                  </div>
                </div>

                {/* HISTORICAL STOCK CHART */}
                <div className="history-section">
                  <div className="panel-heading">
                    <div>
                      <h3>Historical Price</h3>
                      <p>{selectedStock.symbol} closing price history</p>
                    </div>
                  </div>

                  <div className="history-filters">
                    {['1W', '1M', '6M', '1Y'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={historyRange === range ? 'history-filter active' : 'history-filter'}
                        onClick={() => setHistoryRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  {historyLoading && (
                    <p className="muted history-message">
                      Loading historical prices...
                    </p>
                  )}

                  {historyError && (
                    <p className="negative history-message">{historyError}</p>
                  )}

                  {!historyLoading && !historyError && history.length > 0 && (
                    <>
                      <div className="history-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={history}
                            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#293342" />
                            <XAxis
                              dataKey="date"
                              stroke="#8995a5"
                              tick={{ fontSize: 11 }}
                              minTickGap={35}
                            />
                            <YAxis
                              stroke="#8995a5"
                              tick={{ fontSize: 11 }}
                              domain={['auto', 'auto']}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#151e2b',
                                border: '1px solid #344154',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }}
                              formatter={(value) => [
                                `$${Number(value).toFixed(2)}`,
                                'Closing Price'
                              ]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="#36d399"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5, fill: '#36d399' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="history-summary">
                        <div>
                          <p>First recorded price</p>
                          <strong>${Number(history[0].price).toFixed(2)}</strong>
                        </div>

                        <div>
                          <p>Latest recorded price</p>
                          <strong>
                            ${Number(history[history.length - 1].price).toFixed(2)}
                          </strong>
                        </div>

                        <div>
                          <p>Trading sessions</p>
                          <strong>{history.length}</strong>
                        </div>
                      </div>
                    </>
                  )}

                  {!historyLoading && !historyError && history.length === 0 && (
                    <p className="muted history-message">
                      No historical prices available.
                    </p>
                  )}
                </div>
              </div>
            )}

            {!selectedStock && !searchLoading && !searchError && (
              <p className="muted">
                Enter a stock symbol above to view its market information.
              </p>
            )}
          </section>

        ) : activeTab === 'Watchlist' ? (

          /* WATCHLIST */
          <section className="panel watchlist-panel">
            <div className="panel-heading">
              <div>
                <h3>My Watchlist</h3>
                <p>Keep track of stocks you're interested in</p>
              </div>

              <span className="watchlist-count">
                {watchlist.length} {watchlist.length === 1 ? 'Stock' : 'Stocks'}
              </span>
            </div>

            <form onSubmit={handleAddToWatchlist}>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g. AAPL, TSLA)"
                  value={watchlistSymbol}
                  onChange={(event) => {
                    setWatchlistSymbol(event.target.value.toUpperCase())
                    setWatchlistError('')
                  }}
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={watchlistLoading}
                >
                  {watchlistLoading ? 'Adding...' : '+ Add Stock'}
                </button>
              </div>
            </form>

            {watchlistError && (
              <p className="negative watchlist-error">{watchlistError}</p>
            )}

            <div className="watchlist-list">
              {watchlist.length === 0 ? (
                <div className="watchlist-empty">
                  <div className="watchlist-empty-icon">☆</div>
                  <h3>Your watchlist is empty</h3>
                  <p>
                    Add your first stock above to start tracking its price.
                  </p>
                </div>
              ) : (
                <>
                  <div className="watchlist-heading">
                    <span>STOCK</span>
                    <span>PRICE</span>
                    <span>DAILY CHANGE</span>
                    <span>ACTION</span>
                  </div>

                  {watchlist.map((stock) => (
                    <div className="watchlist-row" key={stock.symbol}>
                      <div className="watchlist-stock">
                        <div className="stock-symbol">
                          {stock.symbol.slice(0, 1)}
                        </div>
                        <div>
                          <strong>{stock.symbol}</strong>
                          <small>Stock</small>
                        </div>
                      </div>

                      <strong className="watchlist-price">
                        ${Number(stock.price).toFixed(2)}
                      </strong>

                      <span className={stock.change >= 0 ? 'positive' : 'negative'}>
                        {stock.change > 0 ? '+' : ''}
                        {Number(stock.change).toFixed(2)}%
                      </span>

                      <button
                        type="button"
                        className="watchlist-remove"
                        onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <p className="watchlist-note">
              Prices show the latest available quote from the market data provider.
            </p>
          </section>

        ) : activeTab === 'Risk Assessment' ? (

          /* RISK ASSESSMENT */
          <RiskAssessment />

        ) : (

          /* AI INSIGHTS */
          <section className="panel coming-soon">
            <div className="ai-icon">✧</div>
            <h2>{activeTab}</h2>
            <p>
              This module is part of the InvestIQ platform.
              We'll build its functionality next.
            </p>
            <button
              className="primary-button"
              onClick={() => setActiveTab('Dashboard')}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        <footer>
          © 2026 InvestIQ. Built for smarter investing.
        </footer>
      </main>
    </div>
  )
}

export default App
