import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pypkvuupjxwxhjqssfxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGt2dXVwanh3eGhqcXNzZnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTk4NDUsImV4cCI6MjEwMjczNTg0NX0.ikCWrbA9yT9dmoItiEv983fcUbCj12TsfSDM9EPDuSQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
