import { cookies } from 'next/headers';

export async function getServerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get('enduro_token')?.value ?? null;
}
