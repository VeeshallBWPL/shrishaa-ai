import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type PostStatus = 'pending' | 'approved' | 'rejected' | 'posted'

export interface Post {
  id: string
  garment_image_url: string | null
  generated_image_url: string | null
  caption: string | null
  hashtags: string | null
  status: PostStatus
  created_at: string
}

/*
  Supabase SQL — run this in your project's SQL editor:

  create table posts (
    id uuid primary key default gen_random_uuid(),
    garment_image_url text,
    generated_image_url text,
    caption text,
    hashtags text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'posted')),
    created_at timestamptz not null default now()
  );

  -- Row-Level Security
  alter table posts enable row level security;

  create policy "Allow all for authenticated users"
    on posts for all
    using (auth.role() = 'authenticated');
*/
