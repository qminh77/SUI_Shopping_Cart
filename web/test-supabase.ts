
import { createClient } from '@supabase/supabase-js'

const url = 'https://qeevbmzzdevsleuebmer.supabase.co'
// Using ANON KEY
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZXZibXp6ZGV2c2xldWVibWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODc3MzksImV4cCI6MjA4MjQ2MzczOX0.8ranjbq7Bd0zj6lQ4Ouv9RysGTk-3xaNo_7Ot8Tv5eI'

console.log('URL:', url)
console.log('Anon Key Length:', anonKey?.length)

const supabase = createClient(url, anonKey)

async function test() {
    try {
        // Just try to fetch generic info or shop
        const { data, error } = await supabase.from('shops').select('count', { count: 'exact', head: true })
        if (error) {
            console.error('Supabase Error (Anon):', error)
        } else {
            console.log('Supabase Connection Success (Anon)!')
        }
    } catch (e) {
        console.error('Threw:', e)
    }
}

test()
