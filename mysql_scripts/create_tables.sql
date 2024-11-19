CREATE DATABASE IF NOT EXISTS trade_tracker;

USE trade_tracker;

CREATE TABLE strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    ticker VARCHAR(50) NOT NULL,
    strategy_id INT,
    time_horizon ENUM('Short', 'Mid', 'Long'),
    price DECIMAL(10, 2),
    units FLOAT,
    current_price DECIMAL(10, 2) DEFAULT 0.0,
    open_qty FLOAT,
    matched_trade_ids TEXT,
    realised_pnl DECIMAL(10, 2) DEFAULT 0.0,
    unrealised_pnl DECIMAL(10, 2) DEFAULT 0.0,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id)
);

ALTER TABLE trades ADD COLUMN date_of_trade DATE NOT NULL AFTER date;
ALTER TABLE trades ADD COLUMN current_price FLOAT DEFAULT 0.0 AFTER qty;
ALTER TABLE trades ADD COLUMN pnl INT DEFAULT 0 AFTER qty;
,