import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  prettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
])

export default eslintConfig
