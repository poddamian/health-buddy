import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const MAX_SIZE = 5 * 1024 * 1024

// Uploads an avatar to Storage and returns its public URL. Does not touch
// `profiles` — during onboarding no row exists yet, so the caller attaches
// the returned URL to the profile it upserts at the end of the flow.
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file')
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
        }
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Plik musi być obrazem' }, { status: 400 })
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'Maksymalny rozmiar to 5MB' }, { status: 400 })
        }

        const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1] || 'jpg'
        const path = `${userId}.${ext}`

        const supabase = getAdminSupabase()
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) {
            console.error('Avatar upload error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // Cache-bust so a re-uploaded avatar shows immediately instead of the old cached image.
        const url = `${data.publicUrl}?v=${Date.now()}`

        return NextResponse.json({ url })
    } catch (err) {
        console.error('Avatar upload API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
