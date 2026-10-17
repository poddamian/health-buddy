import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Also touches the database: Supabase Free pauses a project after ~7 days
// without activity, so a daily Vercel cron (vercel.json) hitting this route
// keeps it awake. Returns 503 when the DB is unreachable so uptime monitors
// catch database outages, not just a dead server.
export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .limit(1)

    return NextResponse.json(
        {
            status: error ? 'db_error' : 'ok',
            app: 'Health Buddy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
        },
        { status: error ? 503 : 200 }
    )
}
