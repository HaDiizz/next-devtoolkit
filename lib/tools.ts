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
  Zap,
  Network,
  MessageCircle,
  Database,
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
  {
    id: 'uuid-generator',
    name: 'ID Generator',
    description:
      'Professional unique identifier generator. Quickly create secure UUID v4, NanoID, CUID, ULID, and other industry-standard IDs for your development and testing needs.',
    icon: Fingerprint,
    category: 'Generators',
  },
  {
    id: 'mock-data-generator',
    name: 'Mock Data Generator',
    description:
      'Create realistic mock data for your applications. Generate random user profiles, structured addresses, and consistent JSON data sets for prototyping and automated testing.',
    icon: UserRound,
    category: 'Generators',
  },
  {
    id: 'thai-cid-generator',
    name: 'Thai CID Generator',
    description:
      'Generate valid random Thai Citizen ID numbers (CID) for testing and development. Ensure your application handles Thai identity verification flows correctly with compliant mock data.',
    icon: CreditCard,
    category: 'Generators',
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    description:
      'Standard placeholder text generator for designers and developers. Create custom Lorem Ipsum paragraphs, sentences, or words to fill your layouts and test typography.',
    icon: Type,
    category: 'Generators',
  },
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description:
      'Fully customizable QR code generator. Create high-quality QR codes for URLs, WiFi credentials, vCards, and plain text with adjustable error correction and styling options.',
    icon: QrCode,
    category: 'Generators',
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description:
      'Advanced secure password generator. Create strong, cryptographically secure passwords with custom lengths, character sets, and inclusion rules to protect your accounts and data.',
    icon: KeyRound,
    category: 'Security & Crypto',
  },
  {
    id: 'password-hasher',
    name: 'Password Hasher',
    description:
      'Securely hash and verify passwords using industry-standard algorithms. Support for bcrypt, Argon2, scrypt, and PBKDF2 with customizable cost factors and salt configurations.',
    icon: ShieldCheck,
    category: 'Security & Crypto',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description:
      'Comprehensive text hashing tool. Quickly generate MD5, SHA-1, SHA-256, and SHA-512 hashes with real-time updates for data integrity verification and cryptographic purposes.',
    icon: Shield,
    category: 'Security & Crypto',
  },
  {
    id: 'hmac-generator',
    name: 'HMAC Generator',
    description:
      'Keyed-hash message authentication code (HMAC) generator. Compute secure HMACs using custom secret keys and a variety of standard hash algorithms for secure data verification.',
    icon: Fingerprint,
    category: 'Security & Crypto',
  },
  {
    id: 'encryption-tool',
    name: 'Encryption / Decryption',
    description:
      'Powerful browser-based encryption and decryption. Securely transform text using AES-GCM or AES-CBC algorithms with your own secret keys for maximum data privacy and security.',
    icon: Lock,
    category: 'Security & Crypto',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder',
    description:
      'Efficient Base64 encoder and decoder. Quickly convert text or images to Base64 format and back with live previews, perfect for embedding assets or data URI generation.',
    icon: Binary,
    category: 'Encode & Decode',
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder / Decoder',
    description:
      'Professional URL encoding and decoding tool. Effortlessly transform URL components, query parameters, and special characters into web-safe formats and back with instant results.',
    icon: FileCode,
    category: 'Encode & Decode',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description:
      'Developer-focused JWT decoder and inspector. Securely decode JSON Web Tokens directly in your browser to inspect header details, payload claims, and signature information.',
    icon: KeyRound,
    category: 'Encode & Decode',
  },
  {
    id: 'jwt-builder',
    name: 'JWT Builder / Signer',
    description:
      'Secure JSON Web Token (JWT) builder. Create and sign your own JWTs with custom payloads, headers, and secret keys for testing authentication flows and token verification.',
    icon: Key,
    category: 'Encode & Decode',
  },
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    description:
      'Versatile number base converter for developers. Seamlessly switch between binary, octal, decimal, and hexadecimal representations with support for large numbers and instant updates.',
    icon: Hash,
    category: 'Encode & Decode',
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description:
      'Advanced JSON formatter and validator. Cleanly prettify, minify, and repair JSON data with real-time syntax highlighting for better readability and debugging.',
    icon: Braces,
    category: 'JSON Tools',
  },
  {
    id: 'json-to-typescript',
    name: 'JSON to TypeScript',
    description:
      'Instant JSON to TypeScript interface generator. Paste your JSON data to automatically create accurate, strictly-typed TypeScript definitions for your development projects.',
    icon: FileJson,
    category: 'JSON Tools',
  },
  {
    id: 'json-to-schema',
    name: 'JSON to Schema',
    description:
      'Comprehensive JSON Schema generator. Quickly create JSON Schema (Draft-07) definitions from your sample JSON data to use for validation and API documentation.',
    icon: FileCog,
    category: 'JSON Tools',
  },
  {
    id: 'json-diff',
    name: 'JSON Compare',
    description:
      'Professional JSON comparison tool. Visually compare two JSON objects side-by-side to identify additions, removals, and modifications with detailed diff highlighting.',
    icon: GitCompare,
    category: 'JSON Tools',
  },
  {
    id: 'csv-json-converter',
    name: 'CSV ↔ JSON Converter',
    description:
      'Flexible CSV and JSON data converter. Seamlessly transform data between CSV and JSON formats with advanced options for delimiters, headers, and nested objects.',
    icon: ArrowRightLeft,
    category: 'JSON Tools',
  },
  {
    id: 'css-gradient-generator',
    name: 'CSS Gradient Generator',
    description:
      'Interactive CSS gradient builder. Design stunning linear, radial, and conic gradients with a visual editor, and automatically generate clean, browser-compatible CSS code.',
    icon: Paintbrush,
    category: 'Web & CSS',
  },
  {
    id: 'css-unit-converter',
    name: 'CSS Unit Converter',
    description:
      'Precision CSS unit converter for modern web design. Easily convert between px, rem, em, vw, and vh with customizable root font-size context to ensure responsive layout accuracy.',
    icon: Ruler,
    category: 'Web & CSS',
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description:
      'Comprehensive color format converter. Seamlessly transform color codes between HEX, RGB, HSL, CMYK, and CSS Color Names with real-time visual previews and contrast checking.',
    icon: Palette,
    category: 'Web & CSS',
  },
  {
    id: 'seo-tool',
    name: 'SEO Toolkit',
    description:
      'All-in-one SEO and meta tool. Preview OpenGraph cards, analyze SEO best practices, generate manifest.json files, and export optimized favicon assets for your web applications.',
    icon: SearchCheck,
    category: 'Web & CSS',
  },
  {
    id: 'string-utilities',
    name: 'String Utilities',
    description:
      'Complete suite of string manipulation tools. Includes case conversion, character counting, text reversing, and whitespace removal to simplify common text processing tasks.',
    icon: Shuffle,
    category: 'Text & String',
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description:
      'Real-time regular expression tester and debugger. Validate your regex patterns with instant syntax highlighting, detailed match explanations, and live text testing.',
    icon: Search,
    category: 'Text & String',
  },
  {
    id: 'text-diff-tool',
    name: 'Text Diff Tool',
    description:
      'Advanced text comparison and diff tool. Quickly compare two blocks of text to identify and highlight differences, additions, and removals with a clear side-by-side view.',
    icon: Diff,
    category: 'Text & String',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description:
      'Feature-rich Markdown editor with instant live preview. Full support for GitHub Flavored Markdown (GFM), tables, task lists, and code blocks for documentation and content creators.',
    icon: FileCode,
    category: 'Text & String',
  },
  {
    id: 'line-message-formatter',
    name: 'LINE Message Formatter',
    description:
      'Professional LINE message formatter. Easily convert Markdown text into a perfectly compatible format for LINE Messenger, ensuring your messages look great on any mobile device.',
    icon: MessageCircle,
    category: 'Text & String',
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description:
      'Universal Unix timestamp and date converter. Seamlessly transform between Unix epochs (seconds and milliseconds) and human-readable dates in local or UTC time formats.',
    icon: Clock,
    category: 'Date & Time',
  },
  {
    id: 'timezone-converter',
    name: 'Timezone Converter',
    description:
      'Accurate global timezone converter and world clock. Effortlessly schedule meetings or convert times across any world timezone with support for daylight savings and local offsets.',
    icon: Globe,
    category: 'Date & Time',
  },
  {
    id: 'cron-reader',
    name: 'Cron Expression Reader',
    description:
      'Intuitive cron expression parser and scheduler. Translate complex crontab syntax into clear, human-readable text and view the next scheduled execution times for your jobs.',
    icon: Timer,
    category: 'Date & Time',
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description:
      'High-speed browser-based image converter. Effortlessly transform images between PNG, JPEG, WebP, and BMP formats without uploading any data to a server for maximum privacy.',
    icon: ImageIcon,
    category: 'Media & Files',
  },
  {
    id: 'file-compressor',
    name: 'File Compressor',
    description:
      'Intelligent file and image compression tool. Optimize PNG, JPEG, PDF, and other generic files for faster web loading while maintaining high visual quality and metadata control.',
    icon: Zap,
    category: 'Media & Files',
  },
  {
    id: 'ip-address-tool',
    name: 'IP Address & Geolocation',
    description:
      'Comprehensive IP address and geolocation tool. Instantaneously find your public IPv4/IPv6 address and view detailed network information including ISP, location, and ASN details.',
    icon: Network,
    category: 'Network',
  },
  {
    id: 'sql-analyzer',
    name: 'SQL Analyzer',
    description:
      'Powerful SQL analysis and formatting toolkit. Visualize query structure, analyze table dependencies, calculate complexity, and detect anti-patterns in your SQL queries.',
    icon: Database,
    category: 'Database',
  },
]

export const categories = [...new Set(tools.map((t) => t.category))]
