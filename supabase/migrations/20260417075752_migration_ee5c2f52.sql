ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';