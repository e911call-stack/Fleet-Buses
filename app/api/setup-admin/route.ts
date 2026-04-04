import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  // Safety check — remove this file after use!
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: Create the auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'jeepooly@gmail.com',
    password: 'Test1234',
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Step 2: Create the super_admin profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:        data.user.id,
      full_name: 'Super Admin',
      tenant_id: null,
      role:      'super_admin',
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: 'Super Admin created!',
    userId:  data.user.id,
    email:   'jeepooly@gmail.com',
  })
}
