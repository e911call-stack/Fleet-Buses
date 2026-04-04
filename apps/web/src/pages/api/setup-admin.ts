import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create the auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'jeepooly@gmail.com',
    password: 'Test1234',
    email_confirm: true,
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Create the super_admin profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:        data.user.id,
      full_name: 'Super Admin',
      tenant_id: null,
      role:      'super_admin',
    })

  if (profileError) {
    return res.status(400).json({ error: profileError.message })
  }

  return res.status(200).json({
    success: true,
    message: 'Super Admin created!',
    userId:  data.user.id,
    email:   'jeepooly@gmail.com',
  })
}
