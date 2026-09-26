CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  searches_used INT DEFAULT 0,
  additional_tokens BIGINT DEFAULT 1000000000,
  wallet_balance DECIMAL(10, 2) DEFAULT 100.0,
  auto_recharge BOOLEAN DEFAULT false,
  week_start DATE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);

-- Create index on week_start for weekly reset queries
CREATE INDEX idx_user_quotas_week_start ON user_quotas(week_start);
