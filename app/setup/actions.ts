'use server'

import { install, type InstallResult } from '@/lib/setup'

export async function doInstall(f: FormData): Promise<InstallResult> {
  return install({
    username: String(f.get('username') ?? '').trim(),
    password: String(f.get('password') ?? ''),
    fullName: String(f.get('full_name') ?? '').trim(),
    withDemo: !!f.get('demo'),
  })
}
