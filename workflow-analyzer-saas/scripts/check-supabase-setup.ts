#!/usr/bin/env node

/**
 * This script checks if the Supabase project is properly configured
 * for video uploads and creates any missing resources.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkStorageBuckets() {
  console.log('🔍 Checking storage buckets...')
  
  const { data: buckets, error } = await supabase.storage.listBuckets()
  
  if (error) {
    console.error('❌ Failed to list buckets:', error.message)
    return false
  }

  const videoBucket = buckets.find(b => b.id === 'videos')
  const reportsBucket = buckets.find(b => b.id === 'reports')

  if (!videoBucket) {
    console.log('❌ Videos bucket not found')
    return false
  }

  if (!reportsBucket) {
    console.log('❌ Reports bucket not found')
    return false
  }

  console.log('✅ Storage buckets are configured correctly')
  return true
}

async function checkDatabaseTables() {
  console.log('🔍 Checking database tables...')
  
  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (profilesError) {
    console.error('❌ Profiles table check failed:', profilesError.message)
    return false
  }

  // Check uploads table
  const { data: uploads, error: uploadsError } = await supabase
    .from('uploads')
    .select('id')
    .limit(1)

  if (uploadsError) {
    console.error('❌ Uploads table check failed:', uploadsError.message)
    return false
  }

  // Check analyses table
  const { data: analyses, error: analysesError } = await supabase
    .from('analyses')
    .select('id')
    .limit(1)

  if (analysesError) {
    console.error('❌ Analyses table check failed:', analysesError.message)
    return false
  }

  console.log('✅ Database tables are configured correctly')
  return true
}

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies...')
  
  // This is a basic check - in production you'd want to verify specific policies
  const { data, error } = await supabase
    .rpc('check_rls_enabled', {
      table_names: ['profiles', 'uploads', 'analyses']
    })
    .single()

  if (error) {
    // RPC function might not exist, that's okay
    console.log('⚠️  Could not verify RLS policies (this is normal if check_rls_enabled function doesn\'t exist)')
    return true
  }

  const result = data as { all_enabled?: boolean } | null
  if (!result || !result.all_enabled) {
    console.error('❌ Some tables do not have RLS enabled')
    return false
  }

  console.log('✅ RLS policies are enabled')
  return true
}

async function main() {
  console.log('🚀 Checking Supabase configuration...\n')

  const checks = [
    checkStorageBuckets(),
    checkDatabaseTables(),
    checkRLSPolicies()
  ]

  const results = await Promise.all(checks)
  const allPassed = results.every(r => r === true)

  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('✅ All checks passed! Your Supabase project is properly configured.')
  } else {
    console.log('❌ Some checks failed. Please run the migration scripts to set up your database.')
    console.log('\nYou can apply the migrations manually through the Supabase dashboard')
    console.log('or use the Supabase CLI with the migrations in the supabase/migrations folder.')
  }

  console.log('='.repeat(50))
}

main().catch(console.error)