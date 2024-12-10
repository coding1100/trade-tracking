
-- Add Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Update Strategies Table
ALTER TABLE strategies
ADD COLUMN user_id INT,
ADD CONSTRAINT fk_strategies_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update Trades Table
ALTER TABLE trades
ADD COLUMN user_id INT,
ADD CONSTRAINT fk_trades_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;