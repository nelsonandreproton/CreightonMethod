-- Creighton Method Tracker Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'wife', 'husband', 'practitioner')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cycles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cycle_number)
);

CREATE TABLE IF NOT EXISTS observations (
  id SERIAL PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 100),
  obs_date DATE NOT NULL,
  -- Stamp appearance
  stamp_color VARCHAR(20) NOT NULL CHECK (stamp_color IN ('red', 'green', 'white', 'yellow', 'brown', 'white_baby', 'green_baby')),
  stamp_symbol VARCHAR(10),         -- H, M, L, VL, B, or baby icon indicator
  -- Observation codes
  observation_number VARCHAR(5),    -- 0, 2, 4, 6, 8, 10
  observation_letters VARCHAR(10),  -- C, K, L, CK, KL, AD, etc.
  observation_frequency VARCHAR(5), -- X1, X2, X3 ... or AD (All Day)
  -- Sensation
  sensation VARCHAR(20) CHECK (sensation IN ('dry', 'smooth', 'damp', 'wet', 'lubricative', NULL)),
  -- Special markers
  is_peak_day BOOLEAN DEFAULT FALSE,
  is_menstruation BOOLEAN DEFAULT FALSE,
  -- Free text notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, day_number)
);

CREATE TABLE IF NOT EXISTS practitioner_notes (
  id SERIAL PRIMARY KEY,
  observation_id INTEGER REFERENCES observations(id) ON DELETE CASCADE,
  cycle_id INTEGER REFERENCES cycles(id) ON DELETE CASCADE,
  practitioner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at on observations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS observations_updated_at ON observations;
CREATE TRIGGER observations_updated_at
  BEFORE UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
