import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// As this application runs directly in the browser without a build step,
// the Supabase credentials are included here directly.
// The "anon" key is designed to be public. For security, ensure you have
// Row Level Security (RLS) enabled on your Supabase tables.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rpyhrikatvqutookarwz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWhyaWthdHZxdXRvb2thcnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzY0NTAsImV4cCI6MjA3MTI1MjQ1MH0.wZVZfaa32KDSYKBrillQeXDMswt99ikRQZrbDB0fnZY';

let isConfigured = true;

if (!supabaseUrl || !supabaseAnonKey) {
    isConfigured = false;
    const errorMessage = "Supabase credentials are not set. Please add them to services/supabase.ts";
    
    console.error(errorMessage);

    // Display a prominent error message on the page for easier debugging.
    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = `
                <div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background-color: rgba(240, 240, 240, 0.9); z-index: 9999;">
                    <div style="padding: 2rem; max-width: 600px; text-align: center; font-family: sans-serif; background-color: #fff3f3; border: 1px solid #ffcccc; color: #cc0000; margin: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="font-size: 1.5rem; margin: 0 0 1rem;">Configuration Error</h1>
                        <p style="margin: 0;">${errorMessage}</p>
                    </div>
                </div>
            `;
        }
    });
}

// createClient will throw an error if the URL is missing, which is good.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a flag to check configuration status elsewhere in the app.
export const isSupabaseConfigured = isConfigured;
