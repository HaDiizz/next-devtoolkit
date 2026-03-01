import dynamic from 'next/dynamic'

const toolComponents: Record<string, React.ComponentType> = {
  // Generators
  'uuid-generator': dynamic(() => import('@/components/tools/uuid-generator')),
  'password-generator': dynamic(() => import('@/components/tools/password-generator')),
  'hash-generator': dynamic(() => import('@/components/tools/hash-generator')),
  'encryption-tool': dynamic(() => import('@/components/tools/encryption-tool')),
  'password-hasher': dynamic(() => import('@/components/tools/password-hasher')),
  'lorem-ipsum': dynamic(() => import('@/components/tools/lorem-ipsum')),
  'hmac-generator': dynamic(() => import('@/components/tools/hmac-generator')),
  'qr-code-generator': dynamic(() => import('@/components/tools/qr-code-generator')),
  'css-gradient-generator': dynamic(() => import('@/components/tools/css-gradient-generator')),
  // Converters
  'timestamp-converter': dynamic(() => import('@/components/tools/timestamp-converter')),
  'timezone-converter': dynamic(() => import('@/components/tools/timezone-converter')),
  'base64-converter': dynamic(() => import('@/components/tools/base64-converter')),
  'image-converter': dynamic(() => import('@/components/tools/image-converter')),
  'color-converter': dynamic(() => import('@/components/tools/color-converter')),
  'number-base-converter': dynamic(() => import('@/components/tools/number-base-converter')),
  'csv-json-converter': dynamic(() => import('@/components/tools/csv-json-converter')),
  'css-unit-converter': dynamic(() => import('@/components/tools/css-unit-converter')),
  // JSON Tools
  'json-formatter': dynamic(() => import('@/components/tools/json-formatter')),
  'json-to-typescript': dynamic(() => import('@/components/tools/json-to-typescript')),
  'json-to-schema': dynamic(() => import('@/components/tools/json-to-schema')),
  'json-diff': dynamic(() => import('@/components/tools/json-diff')),
  // Encode / Decode
  'url-encoder': dynamic(() => import('@/components/tools/url-encoder')),
  'jwt-decoder': dynamic(() => import('@/components/tools/jwt-decoder')),
  'jwt-builder': dynamic(() => import('@/components/tools/jwt-builder')),
  // String & Regex
  'string-utilities': dynamic(() => import('@/components/tools/string-utilities')),
  'regex-tester': dynamic(() => import('@/components/tools/regex-tester')),
  'text-diff-tool': dynamic(() => import('@/components/tools/text-diff-tool')),
  // Date / Time
  'cron-reader': dynamic(() => import('@/components/tools/cron-reader')),
  // Data
  'mock-data-generator': dynamic(() => import('@/components/tools/mock-data-generator')),
  'thai-cid-generator': dynamic(() => import('@/components/tools/thai-cid-generator')),
}

export function getToolComponent(id: string): React.ComponentType | null {
  return toolComponents[id] || null
}
