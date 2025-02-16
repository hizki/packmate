/*
  # Create saved lists table

  1. New Tables
    - `saved_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `destinations` (jsonb)
      - `accommodation` (text)
      - `activities` (text[])
      - `companions` (text)
      - `dates` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_lists` table
    - Add policies for authenticated users to:
      - Read their own lists
      - Create new lists
      - Update their own lists
      - Delete their own lists
*/

CREATE TABLE IF NOT EXISTS saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  destinations jsonb NOT NULL,
  accommodation text NOT NULL,
  activities text[] NOT NULL,
  companions text NOT NULL,
  dates jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own lists
CREATE POLICY "Users can read own lists"
  ON saved_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create new lists
CREATE POLICY "Users can create lists"
  ON saved_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own lists
CREATE POLICY "Users can update own lists"
  ON saved_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own lists
CREATE POLICY "Users can delete own lists"
  ON saved_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_saved_lists_updated_at
  BEFORE UPDATE ON saved_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();