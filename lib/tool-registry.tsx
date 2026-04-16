import dynamic from 'next/dynamic'

const toolComponents: Record<string, React.ComponentType> = {
  'uuid-generator': dynamic(() => import('@/components/tools/uuid-generator')),
  'mock-data-generator': dynamic(() => import('@/components/tools/mock-data-generator')),
  'thai-cid-generator': dynamic(() => import('@/components/tools/thai-cid-generator')),
  'lorem-ipsum': dynamic(() => import('@/components/tools/lorem-ipsum')),
  'qr-code-generator': dynamic(() => import('@/components/tools/qr-code-generator')),
  'password-generator': dynamic(() => import('@/components/tools/password-generator')),
  'password-hasher': dynamic(() => import('@/components/tools/password-hasher')),
  'hash-generator': dynamic(() => import('@/components/tools/hash-generator')),
  'hmac-generator': dynamic(() => import('@/components/tools/hmac-generator')),
  'encryption-tool': dynamic(() => import('@/components/tools/encryption-tool')),
  'base64-converter': dynamic(() => import('@/components/tools/base64-converter')),
  'url-encoder': dynamic(() => import('@/components/tools/url-encoder')),
  'jwt-decoder': dynamic(() => import('@/components/tools/jwt-decoder')),
  'jwt-builder': dynamic(() => import('@/components/tools/jwt-builder')),
  'number-base-converter': dynamic(() => import('@/components/tools/number-base-converter')),
  'json-formatter': dynamic(() => import('@/components/tools/json-formatter')),
  'json-to-typescript': dynamic(() => import('@/components/tools/json-to-typescript')),
  'json-to-schema': dynamic(() => import('@/components/tools/json-to-schema')),
  'json-diff': dynamic(() => import('@/components/tools/json-diff')),
  'csv-json-converter': dynamic(() => import('@/components/tools/csv-json-converter')),
  'css-gradient-generator': dynamic(() => import('@/components/tools/css-gradient-generator')),
  'css-unit-converter': dynamic(() => import('@/components/tools/css-unit-converter')),
  'color-converter': dynamic(() => import('@/components/tools/color-converter')),
  'seo-tool': dynamic(() => import('@/components/tools/seo-tool')),
  'string-utilities': dynamic(() => import('@/components/tools/string-utilities')),
  'regex-tester': dynamic(() => import('@/components/tools/regex-tester')),
  'text-diff-tool': dynamic(() => import('@/components/tools/text-diff-tool')),
  'markdown-preview': dynamic(() => import('@/components/tools/markdown-preview')),
  'line-message-formatter': dynamic(() => import('@/components/tools/line-message-formatter')),
  'timestamp-converter': dynamic(() => import('@/components/tools/timestamp-converter')),
  'timezone-converter': dynamic(() => import('@/components/tools/timezone-converter')),
  'cron-reader': dynamic(() => import('@/components/tools/cron-reader')),
  'image-converter': dynamic(() => import('@/components/tools/image-converter')),
  'file-compressor': dynamic(() => import('@/components/tools/file-compressor')),
  'ip-address-tool': dynamic(() => import('@/components/tools/ip-address-tool')),
  'sql-analyzer': dynamic(() => import('@/components/tools/sql-analyzer')),
}

export function getToolComponent(id: string): React.ComponentType | null {
  return toolComponents[id] || null
}
