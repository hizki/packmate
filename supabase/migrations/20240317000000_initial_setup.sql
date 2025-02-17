-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create storage bucket for user uploads
insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true);

-- Create storage policy to allow authenticated users to upload files
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-uploads' AND
  auth.uid() = owner
);

-- Create storage policy to allow public to view files
create policy "Allow public to view files"
on storage.objects for select
to public
using (bucket_id = 'user-uploads');

-- Create saved_lists table
CREATE TABLE IF NOT EXISTS saved_lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Enable RLS on saved_lists
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

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_saved_lists_updated_at
  BEFORE UPDATE ON saved_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 