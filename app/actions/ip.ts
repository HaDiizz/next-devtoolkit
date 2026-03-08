'use server'

import { headers } from 'next/headers'

export async function getIpInfo() {
  const headersList = await headers()

  let ipCandidate =
    headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP'
  if (ipCandidate.includes(',')) {
    ipCandidate = ipCandidate.split(',')[0].trim()
  }

  return {
    ip: ipCandidate,
    country: headersList.get('x-vercel-ip-country') || '',
    region: headersList.get('x-vercel-ip-country-region') || '',
    city: headersList.get('x-vercel-ip-city') || '',
    latitude: headersList.get('x-vercel-ip-latitude') || '',
    longitude: headersList.get('x-vercel-ip-longitude') || '',
    continent: headersList.get('x-vercel-ip-continent') || '',
  }
}
