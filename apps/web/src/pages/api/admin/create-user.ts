import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { email, password, full_name, role, tenant_id } = req.body

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return res.status(400).json({ error: error.message })

  const { error: profileError } = await supabase.from('profiles').upsert({
    id:        data.user.id,
    full_name: full_name || null,
    role:      role || 'viewer',
    tenant_id: tenant_id || null,
    is_active: true,
  })

  if (profileError) return res.status(400).json({ error: profileError.message })

  return res.status(200).json({ success: true })
}
