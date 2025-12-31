import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dolftriddqmhcjtddvcd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbGZ0cmlkZHFtaGNqdGRkdmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjgxNDQsImV4cCI6MjA4MjY0NDE0NH0.O9rKilY1gGPaIOpUzIbBU0PBYDR-yRpTv3DLiBVMV20'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
