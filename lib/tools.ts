import {
  Fingerprint,
  Clock,
  KeyRound,
  Braces,
  UserRound,
  CreditCard,
  Hash,
  FileCode,
  Type,
  Palette,
  Binary,
  Shuffle,
  Shield,
  Lock,
  ImageIcon,
  Search,
  Globe,
  FileJson,
  GitCompare,
  FileCog,
  Timer,
  ShieldCheck,
  QrCode,
  ArrowRightLeft,
  Ruler,
  Paintbrush,
  Diff,
  Key,
  SearchCheck,
  type LucideIcon,
} from 'lucide-react'

export interface Tool {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: string
}

export const tools: Tool[] = [
  // --- Generators ---
  {
    id: 'uuid-generator',
    name: 'ID Generator',
    description: 'Generate UUID v4, CUID, NanoID, ULID and more unique identifiers',
    icon: Fingerprint,
    category: 'Generators',
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Create strong passwords with custom rules and character sets',
    icon: KeyRound,
    category: 'Generators',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes from text',
    icon: Shield,
    category: 'Generators',
  },
  {
    id: 'encryption-tool',
    name: 'Encryption / Decryption',
    description: 'Encrypt and decrypt text with AES-GCM or AES-CBC using a secret key',
    icon: Lock,
    category: 'Generators',
  },
  {
    id: 'password-hasher',
    name: 'Password Hasher',
    description: 'Securely hash passwords with bcrypt, Argon2, scrypt, or PBKDF2',
    icon: ShieldCheck,
    category: 'Generators',
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    description: 'Generate placeholder text in paragraphs, sentences, or words',
    icon: Type,
    category: 'Generators',
  },
  {
    id: 'hmac-generator',
    name: 'HMAC Generator',
    description: 'Generate HMAC with custom secret keys and hash algorithms',
    icon: Fingerprint,
    category: 'Generators',
  },
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Create customizable QR codes for URLs, WiFi, vCards, and more',
    icon: QrCode,
    category: 'Generators',
  },
  {
    id: 'css-gradient-generator',
    name: 'CSS Gradient Generator',
    description: 'Create beautiful linear, radial, and conic CSS gradients visually',
    icon: Paintbrush,
    category: 'Generators',
  },

  // --- Converters ---
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    icon: Clock,
    category: 'Converters',
  },
  {
    id: 'timezone-converter',
    name: 'Timezone Converter',
    description: 'Convert times between different timezones around the world',
    icon: Globe,
    category: 'Converters',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder',
    description: 'Encode/decode Base64 strings and images with live preview',
    icon: Binary,
    category: 'Converters',
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images between PNG, JPEG, WebP, and BMP formats',
    icon: ImageIcon,
    category: 'Converters',
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB, HSL, and other color formats',
    icon: Palette,
    category: 'Converters',
  },
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    description: 'Convert between binary, octal, decimal, and hexadecimal',
    icon: Hash,
    category: 'Converters',
  },
  {
    id: 'csv-json-converter',
    name: 'CSV ↔ JSON Converter',
    description: 'Convert data between CSV and JSON formats with advanced options',
    icon: ArrowRightLeft,
    category: 'Converters',
  },
  {
    id: 'css-unit-converter',
    name: 'CSS Unit Converter',
    description: 'Convert CSS units (px, rem, em, vw, vh) with custom context',
    icon: Ruler,
    category: 'Converters',
  },

  // --- JSON Tools ---
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Prettify, minify, and validate JSON data with syntax highlighting',
    icon: Braces,
    category: 'JSON Tools',
  },
  {
    id: 'json-to-typescript',
    name: 'JSON to TypeScript',
    description: 'Generate TypeScript interfaces from JSON data automatically',
    icon: FileJson,
    category: 'JSON Tools',
  },
  {
    id: 'json-to-schema',
    name: 'JSON to Schema',
    description: 'Generate JSON Schema (Draft-07) from sample JSON data',
    icon: FileCog,
    category: 'JSON Tools',
  },
  {
    id: 'json-diff',
    name: 'JSON Compare',
    description: 'Compare two JSON objects side-by-side and see a detailed diff',
    icon: GitCompare,
    category: 'JSON Tools',
  },

  // --- Encode / Decode ---
  {
    id: 'url-encoder',
    name: 'URL Encoder/Decoder',
    description: 'Encode and decode URL components and query strings',
    icon: FileCode,
    category: 'Encode / Decode',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode JWTs and inspect header, payload, and claims in detail',
    icon: KeyRound,
    category: 'Encode / Decode',
  },
  {
    id: 'jwt-builder',
    name: 'JWT Builder / Signer',
    description: 'Build and sign JSON Web Tokens with custom payload and claims',
    icon: Key,
    category: 'Encode / Decode',
  },

  // --- String & Regex ---
  {
    id: 'string-utilities',
    name: 'String Utilities',
    description: 'Case conversion, character count, reverse, and text manipulation',
    icon: Shuffle,
    category: 'String & Regex',
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions with real-time highlighting and match details',
    icon: Search,
    category: 'String & Regex',
  },
  {
    id: 'text-diff-tool',
    name: 'Text Diff Tool',
    description: 'Compare two text blocks and highlight additions, removals, and changes',
    icon: Diff,
    category: 'String & Regex',
  },

  // --- Date / Time ---
  {
    id: 'cron-reader',
    name: 'Cron Expression Reader',
    description: 'Parse cron expressions into human-readable text with next run predictions',
    icon: Timer,
    category: 'Date / Time',
  },

  // --- Data ---
  {
    id: 'mock-data-generator',
    name: 'Mock Data Generator',
    description: 'Generate random user profiles, addresses, and structured JSON data',
    icon: UserRound,
    category: 'Data',
  },
  {
    id: 'thai-cid-generator',
    name: 'Thai CID Generator',
    description: 'Generate valid random Thai Citizen ID numbers for testing',
    icon: CreditCard,
    category: 'Data',
  },

  {
    id: 'seo-tool',
    name: 'SEO Toolkit',
    description:
      'Preview OG cards, score SEO, check best practices, generate manifest.json, and export favicon assets',
    icon: SearchCheck,
    category: 'SEO',
  },
]

export const categories = [...new Set(tools.map((t) => t.category))]
