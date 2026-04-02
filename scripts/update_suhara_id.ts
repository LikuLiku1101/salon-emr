import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateStaff() {
  const { data, error } = await supabase
    .from('staff')
    .update({ line_user_id: 'U720e4d9de0a7e592e1d9cd076096b6b9' })
    .ilike('name', '%須原%') // 名前が「須原」を含むスタッフを更新
    .select()

  if (error) {
    console.error('Error updating staff:', error)
  } else {
    console.log('Successfully updated staff:', data)
  }
}

updateStaff()
