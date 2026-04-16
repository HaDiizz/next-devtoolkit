import { Parser } from 'node-sql-parser'

const parser = new Parser()

export interface SQLAnalysis {
  tables: string[]
  columns: string[]
  subqueries: { level: number; sql: string }[]
  complexity: {
    score: number
    details: string[]
  }
  explanation: string[]
  antiPatterns: { severity: 'low' | 'medium' | 'high'; message: string }[]
  ast: unknown
}

function getIdentifierName(id: unknown): string {
  if (typeof id === 'string') return id
  if (id && typeof id === 'object') {
    const raw = id as Record<string, unknown>
    if (raw.expr && typeof raw.expr === 'object') {
      const expr = raw.expr as Record<string, unknown>
      if (expr.value) return String(expr.value)
    }
    if (raw.value) return String(raw.value)
  }
  return id !== null && id !== undefined ? String(id) : ''
}

export const SQL_DIALECTS = [
  { id: 'mysql', name: 'MySQL' },
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'mariadb', name: 'MariaDB' },
  { id: 'sqlserver', name: 'SQL Server' },
  { id: 'oracle', name: 'Oracle' },
] as const

export type SQLDialect = (typeof SQL_DIALECTS)[number]['id']

const dialectMap: Record<string, string> = {
  postgresql: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mariadb',
  sqlite: 'sqlite',
  sqlserver: 'transactsql',
  oracle: 'oracle',
}

export function analyzeSQL(sql: string, dialect: string = 'postgresql'): SQLAnalysis {
  try {
    const ast = parser.astify(sql, { database: dialectMap[dialect.toLowerCase()] || 'postgresql' })
    const astArray = (Array.isArray(ast) ? ast : [ast]) as unknown as Record<string, unknown>[]

    const tables = new Set<string>()
    const columns = new Set<string>()
    const subqueries: { level: number; sql: string }[] = []
    let joinCount = 0
    let subqueryCount = 0

    const traverse = (node: unknown, level: number = 0) => {
      if (!node || typeof node !== 'object') return

      const n = node as Record<string, unknown>

      if (n.ast) {
        try {
          const subAst = n.ast as Record<string, unknown>
          subAst._sql = parser.sqlify(n.ast as Parameters<typeof parser.sqlify>[0], {
            database: dialectMap[dialect.toLowerCase()] || 'postgresql',
          })
        } catch {
          const subAst = n.ast as Record<string, unknown>
          subAst._sql = 'Failed to stringify subquery'
        }
        traverse(n.ast, level + 1)
      } else if (n.type === 'select') {
        if (level > 0 && n._sql) {
          subqueries.push({ level, sql: n._sql as string })
          subqueryCount++
        }

        if (n.columns) {
          if (Array.isArray(n.columns)) {
            n.columns.forEach((col: unknown) => {
              const c = col as Record<string, unknown>
              const expr = c.expr as Record<string, unknown> | undefined
              if (expr?.type === 'column_ref') {
                const table = getIdentifierName(expr.table)
                const column = getIdentifierName(expr.column)
                const colName = table ? `${table}.${column}` : column
                columns.add(colName)
              }
              traverse(expr, level)
            })
          } else if (n.columns === '*') {
            columns.add('*')
          }
        }

        if (n.from && Array.isArray(n.from)) {
          n.from.forEach((f: unknown) => {
            const tableRef = f as Record<string, unknown>
            if (tableRef.table) {
              tables.add(getIdentifierName(tableRef.table))
            }
            if (tableRef.join) joinCount++
            traverse(tableRef.on, level)
            traverse(tableRef.expr, level)
          })
        }

        traverse(n.where, level)
        traverse(n.groupby, level)
        traverse(n.having, level)
        traverse(n.orderby, level)
      } else {
        Object.keys(n).forEach((key) => {
          if (key !== 'ast') traverse(n[key], level)
        })
      }
    }

    astArray.forEach((node) => {
      node._sql = sql
      traverse(node)
    })

    const complexityScore = joinCount * 2 + subqueryCount * 3 + (columns.has('*') ? 1 : 0)
    const complexityDetails = [`${joinCount} JOINs`, `${subqueryCount} nested subqueries`]

    const explanation: string[] = []
    astArray.forEach((node) => {
      if (node.type === 'select') {
        explanation.push(
          `Step ${explanation.length + 1}: Select data from ${Array.from(tables).join(', ')}`,
        )
        if (joinCount > 0)
          explanation.push(
            `Step ${explanation.length + 1}: Join tables based on defined conditions`,
          )
        if (node.where)
          explanation.push(`Step ${explanation.length + 1}: Filter results using WHERE clause`)
        if (node.groupby)
          explanation.push(`Step ${explanation.length + 1}: Group data for aggregation`)
        if (subqueryCount > 0)
          explanation.push(
            `Step ${explanation.length + 1}: Process nested subqueries for filtering or data retrieval`,
          )
      }
    })

    const antiPatterns: { severity: 'low' | 'medium' | 'high'; message: string }[] = []
    if (columns.has('*')) {
      antiPatterns.push({
        severity: 'medium',
        message: 'Use of "SELECT *" is discouraged. Explicitly list required columns.',
      })
    }
    if (subqueryCount > 3) {
      antiPatterns.push({
        severity: 'high',
        message:
          'Deeply nested subqueries detected. Consider using CTEs or temporary tables for better readability.',
      })
    }
    if (joinCount > 5) {
      antiPatterns.push({
        severity: 'medium',
        message: 'High number of JOINs might impact performance. Ensure proper indexing.',
      })
    }

    return {
      tables: Array.from(tables),
      columns: Array.from(columns),
      subqueries,
      complexity: {
        score: Math.min(10, complexityScore),
        details: complexityDetails,
      },
      explanation,
      antiPatterns,
      ast: astArray[0],
    }
  } catch (e: unknown) {
    throw new Error(`Failed to analyze SQL: ${(e as Error).message}`)
  }
}
