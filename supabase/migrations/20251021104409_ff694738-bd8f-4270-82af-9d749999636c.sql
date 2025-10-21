-- Create utm_campaigns table
CREATE TABLE utm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Create utm_platforms table
CREATE TABLE utm_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create utm_languages table
CREATE TABLE utm_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Add new columns to utm_links
ALTER TABLE utm_links
  ADD COLUMN platform text,
  ADD COLUMN language text,
  ADD COLUMN campaign_name text,
  ADD COLUMN month_year text,
  ADD COLUMN link_purpose text CHECK (link_purpose IN ('AO', 'Seminar', 'Webinar', 'Education'));

-- Enable RLS on new tables
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for utm_campaigns
CREATE POLICY "Campaigns viewable by authenticated users"
  ON utm_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create campaigns"
  ON utm_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage campaigns"
  ON utm_campaigns FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for utm_platforms
CREATE POLICY "Platforms viewable by authenticated users"
  ON utm_platforms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage platforms"
  ON utm_platforms FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for utm_languages
CREATE POLICY "Languages viewable by authenticated users"
  ON utm_languages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage languages"
  ON utm_languages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Insert initial campaigns
INSERT INTO utm_campaigns (name) VALUES
  ('Gold'), ('Stocks'), ('Hamilton'), ('Brand'), ('More&Better'),
  ('Trade Your Way'), ('Indices'), ('Energies'), ('Oil'), ('Silver'),
  ('Tradingview'), ('Platforms'), ('Gold Seasonal'), ('Silver Seasonal'),
  ('FOREX'), ('Academy'), ('Referral'), ('Demo Competition'), ('Demo Account'),
  ('Earnings'), ('Generic'), ('Jackson Hole'), ('Why Choose Us'), ('UGC Alsanee'),
  ('Volatility Meets Opportunities Seasonal'), ('Sharapova'), ('Products'),
  ('Competitors'), ('MI Cape Town'), ('AC Milan'), ('MTV Banners'),
  ('Interest Rate'), ('Diversification'), ('Chinese Stocks'), ('Payment Options'),
  ('LB Basketball'), ('Social Trading'), ('Metals'), ('Leading Broker'),
  ('Crypto'), ('Bitcoin'), ('Ethereum'), ('Ripple'), ('Solana'), ('TRX'),
  ('MetaTrader'), ('Nvidia'), ('Tesla'), ('Rewards'), ('October Seasonal'), ('Q3 Report');

-- Insert initial platforms
INSERT INTO utm_platforms (name) VALUES
  ('Facebook'), ('Instagram'), ('X'), ('TikTok'), ('Snap'), ('Reddit'),
  ('Search'), ('PMax'), ('DGen'), ('YouTube'), ('Bing'), ('Whatsapp'),
  ('FXStreet'), ('Careem'), ('Sales'), ('LG'), ('Display'), ('MTV'), ('Telegram');

-- Insert initial languages
INSERT INTO utm_languages (code, name) VALUES
  ('EN', 'English'),
  ('AR', 'Arabic'),
  ('AZ', 'Azerbaijani'),
  ('ES', 'Spanish');