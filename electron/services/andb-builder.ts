import { app } from 'electron'
import path from 'path'

// Import dependencies safely
// @ts-ignore
const { Container } = require('@the-andb/core')
// @ts-ignore
const Logger = require('andb-logger')

/**
 * AndbBuilder Service
 * 
 * Dynamically builds andb-core configuration from selected connection pairs
 * Replaces subprocess approach with programmatic API
 */

interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  password?: string
  environment: string
  domainMapping?: {
    from: string
    to: string
  }
  productSettings?: {
    domain?: string
    emailServer?: string
  }
}

interface ConnectionPair {
  id: string
  name: string
  sourceEnv: string
  targetEnv: string
}

interface AndbConfig {
  getDBDestination: (env: string, mail?: boolean) => any
  getSourceEnv: (envName: string) => string
  getDestEnv: (env: string) => string
  getDBName: (env: string, isDbMail?: boolean) => string
  replaceWithEnv: (ddl: string, destEnv: string) => string
  ENVIRONMENTS: Record<string, string>
  baseDir: string
  logName: string
  storage?: 'file' | 'sqlite' | 'hybrid'
  storagePath?: string
  enableFileOutput?: boolean  // Deprecated, use storage config instead
  dataStore?: any  // Deprecated, use storage config instead
  domainNormalization?: { pattern: string | RegExp, replacement: string }
  isNotMigrateCondition?: string | RegExp
}

export class AndbBuilder {
  // NEW: SQLiteStorage instance (shared across all operations)
  private static sqliteStorage: any = null

  public static async getReportList() {
    // We prefer JSON reports now
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(app.getPath('userData'), 'reports')
    const jsonReportDir = path.join(reportDir, 'json')

    let reports: any[] = []

    // 1. Check for new JSON reports
    if (fs.existsSync(jsonReportDir)) {
      try {
        const files = fs.readdirSync(jsonReportDir)
        files.forEach((file: string) => {
          if (file.endsWith('.json')) {
            const stats = fs.statSync(path.join(jsonReportDir, file))
            reports.push({
              name: file, // Keep .json extension so getReportContent knows what to do
              path: path.join(jsonReportDir, file),
              size: stats.size,
              mtime: stats.mtime
            })
          }
        })
      } catch (e) {
        if ((global as any).logger) (global as any).logger.error('Error reading json reports directory', e)
      }
    }

    // 2. Check for legacy HTML reports (optional, if we want backward compat)
    /* 
    if (fs.existsSync(reportDir)) {
        // ... (existing logic)
    }
    */
    // For now, let's just use JSON if available, or maybe merge them?
    // User wants "switch approach", so let's focus on JSON.
    // If no JSON reports, maybe list HTML for migration? But let's stick to JSON.

    // Sort by modification time (newest first)
    return reports.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
  }

  public static async getReportContent(filename: string) {
    const fs = require('fs')
    const path = require('path')
    // The previous implementation looked for HTML files in 'reports'
    // The new implementation looks for JSON files in 'reports/json'
    // filename coming in might be "dbname.env.json" or just a name.

    // Let's assume the UI sends the full filename derived from getReportList
    const reportDir = path.join(app.getPath('userData'), 'reports')

    // Try to find the file. If it ends with .html, try to find the corresponding .json
    // But since we are changing the paradigm, we should expect the UI to ask for JSON.
    // However, legacy reports are HTML.

    let filePath = path.join(reportDir, filename)

    // If the request is for an HTML file, try to find the JSON version in the 'json' subdirectory
    if (filename.endsWith('.html')) {
      // Typically "dbname.env.html" -> we want "reports/json/dbname.env.json"
      // But wait, the previous code saved HTML to 'reports/filename'.
      // ReportHelper saves JSON to 'reports/json/dbname.env.json'.

      // Let's try to infer the JSON path.
      const basename = path.basename(filename, '.html');
      // The new path should be reports/json/[basename].json
      filePath = path.join(reportDir, 'json', `${basename}.json`)
    } else {
      // If it's already asking for something else, or if the list returns json files.
      // Let's check if it is in json folder
      if (fs.existsSync(path.join(reportDir, 'json', filename))) {
        filePath = path.join(reportDir, 'json', filename);
      }
    }

    // Security check
    if (!filePath.startsWith(reportDir)) { // Basic check, realpath would be better but simple prefix check for now
      return null;
    }

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        // Return parsed JSON if it is a json file, otherwise string
        if (filePath.endsWith('.json')) {
          return JSON.parse(content)
        }
        return content
      } catch (e) {
        if ((global as any).logger) (global as any).logger.error(`Failed to read report file ${filePath}`, e)
        return null
      }
    }

    return null
  }

  public static async deleteAllReports() {
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(app.getPath('userData'), 'reports')

    if (!fs.existsSync(reportDir)) return

    const files = fs.readdirSync(reportDir)
    for (const file of files) {
      if (file.endsWith('.html')) {
        fs.unlinkSync(path.join(reportDir, file))
      }
    }
  }

  public static async getDatabaseStats() {
    const storage = this.getSQLiteStorage()
    return await storage.getStats()
  }

  /**
   * Get or create SQLiteStorage instance
   */
  public static getSQLiteStorage() {
    if (!this.sqliteStorage) {
      const { SQLiteStorage } = require('@the-andb/core')
      const dbPath = path.join(app.getPath('userData'), 'andb-storage.db')
      this.sqliteStorage = new SQLiteStorage(dbPath, app.getPath('userData'))
    }
    return this.sqliteStorage
  }

  /**
   * Build andb-core config from connection pair
   */
  static buildConfig(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    extraConfig: any = {}
  ): AndbConfig {
    // Build ENVIRONMENTS object dynamically with uppercase keys
    const sEnv = sourceConn.environment.toUpperCase()
    const ENVIRONMENTS: Record<string, string> = {
      [sEnv]: sEnv
    }

    if (targetConn) {
      const tEnv = targetConn.environment.toUpperCase()
      ENVIRONMENTS[tEnv] = tEnv
    }

    return {
      // DEBUG: Log core path
      ...(this.getCorePath(), {}),

      /**
       * Get database destination configuration
       */
      getDBDestination: (env: string, mail = false) => {
        if (!env) return undefined

        const srcEnv = sourceConn?.environment?.toUpperCase()
        const trgEnv = targetConn?.environment?.toUpperCase()
        const currentEnv = env.toUpperCase()

        const conn = (srcEnv && currentEnv === srcEnv)
          ? sourceConn
          : (trgEnv && currentEnv === trgEnv ? targetConn : null)

        if (!conn) return undefined

        // Resolve path if it's relative
        let host = conn.host
        const fs = require('fs')
        const isDump = (conn as any).type === 'dump' || (host && host.toLowerCase().endsWith('.sql')) || (host && host.includes('.sql'))

        if ((global as any).logger) {
          (global as any).logger.info(`[AndbBuilder] Resolving path: type=${(conn as any).type}, host=${host}, isDump=${isDump}`);
        }

        if (isDump && (host.startsWith('./') || !path.isAbsolute(host))) {
          const appPath = app.getAppPath()
          const directPath = path.resolve(appPath, host)
          const publicPath = path.resolve(appPath, 'public', host)

          if (fs.existsSync(directPath)) {
            host = directPath
          } else if (fs.existsSync(publicPath)) {
            host = publicPath
          } else {
            // Fallback to direct path
            host = directPath
          }
        }

        if ((global as any).logger && isDump) {
          (global as any).logger.info(`[AndbBuilder] Resolved Dump path: ${host} (Exists: ${fs.existsSync(host)})`);
        }

        return {
          envName: conn.environment,
          host: host,
          port: conn.port || 3306,
          database: mail ? undefined : conn.database,
          user: conn.username,
          type: isDump ? 'dump' : ((conn as any).type || 'mysql'), // Ensure Core uses 'dump' driver for .sql files
          dumpPath: host,
          ...(conn.password ? { password: conn.password } : {})
        }
      },

      /**
       * Get source environment (always return source from pair)
       */
      getSourceEnv: (_envName: string) => {
        return sourceConn?.environment || ''
      },

      /**
       * Get destination environment (always return target from pair)
       */
      getDestEnv: (_env: string) => {
        return targetConn?.environment || ''
      },

      /**
       * Get database name for environment
       */
      getDBName: (env: string, _isDbMail = false) => {
        if (!env) return ''

        const srcEnv = sourceConn?.environment?.toUpperCase()
        const trgEnv = targetConn?.environment?.toUpperCase()
        const currentEnv = env.toUpperCase()

        const conn = (srcEnv && currentEnv === srcEnv)
          ? sourceConn
          : (trgEnv && currentEnv === trgEnv ? targetConn : null)

        return conn?.database || ''
      },

      /**
       * Replace domain in DDL based on destination environment
       * Example: @dev.example.com → @prod.example.com
       */
      replaceWithEnv: (ddl: string, destEnv: string) => {
        let result = ddl

        // Apply source domain mapping (if exists)
        if (sourceConn.domainMapping?.from && sourceConn.domainMapping?.to) {
          result = result.replace(
            new RegExp(sourceConn.domainMapping.from, 'g'),
            sourceConn.domainMapping.to
          )
        }

        // Apply target domain mapping (if exists)
        if (targetConn?.domainMapping?.from && targetConn?.domainMapping?.to) {
          result = result.replace(
            new RegExp(targetConn.domainMapping.from, 'g'),
            targetConn.domainMapping.to
          )
        }

        /**
         * Dynamic Product Settings Replacement
         * Replaces values based on Source vs Target configuration
         */
        if (targetConn && targetConn.productSettings && sourceConn.productSettings) {
          // 1. Email Server Domain Replacement
          // e.g. Replace @dev.abc.net with @prod.abc.net
          if (sourceConn.productSettings.emailServer && targetConn.productSettings.emailServer) {
            // Create regex escaping special chars
            const escapedSource = sourceConn.productSettings.emailServer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.emailServer);
          }

          // 2. Project Domain Replacement
          // e.g. Replace dev.abc.com with prod.abc.com
          if (sourceConn.productSettings.domain && targetConn.productSettings.domain) {
            const escapedSource = sourceConn.productSettings.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.domain);
          }
        }
        return result
      },

      ENVIRONMENTS,
      baseDir: app.getPath('userData'),
      logName: 'andb',

      // Storage Configuration - Use SQLite for better performance
      storage: 'sqlite',
      storagePath: require('path').join(app.getPath('userData'), 'andb-storage.db'),
      enableFileOutput: false,  // Disable file output, use SQLite only
      ...extraConfig
    }
  }

  public static getCorePath() {
    try {
      require.resolve('@the-andb/core');
      require.resolve('@the-andb/core/package.json');
    } catch (e) {
      // Quietly fail
    }
  }

  /**
   * Build and execute andb-core operation
   */
  static async execute(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    operation: 'export' | 'compare' | 'migrate' | 'generate' | 'getSchemaObjects',
    options: any = {}
  ): Promise<any> {
    const fs = require('fs')
    const originalCwd = process.cwd()
    const userDataDir = app.getPath('userData')

    try {
      // Strict Rule: Disallow comparison within the same environment
      if (targetConn && sourceConn?.environment?.toUpperCase() === targetConn?.environment?.toUpperCase()) {
        throw new Error(`Comparison within the same environment '${sourceConn.environment}' is not permitted. Please select different environments to prevent conflicts.`)
      }

      // Force CWD to userData to ensure andb-core writes files there
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      process.chdir(userDataDir)

      // Build config from pair
      const config = this.buildConfig(sourceConn, targetConn, {
        domainNormalization: options.domainNormalization,
        isNotMigrateCondition: options.isNotMigrateCondition
      })

      if ((global as any).logger) {
        (global as any).logger.info(`[AndbBuilder] Executing ${operation}: ${sourceConn.name} (${sourceConn.environment}) -> ${targetConn?.name || 'None'} (${targetConn?.environment || 'None'})`);
        (global as any).logger.info(`[AndbBuilder] Source Type: ${(sourceConn as any).type}, Host: ${sourceConn.host}, DB: ${sourceConn.database}`);
      }

      // Initialize global logger
      try {
        let loggerInstance;
        if (typeof Logger.getInstance === 'function') {
          loggerInstance = Logger.getInstance({
            mode: 'PROD',
            dirpath: app.getPath('userData'),
            logName: 'ANDB-UI'
          });
        } else if (typeof Logger === 'function') {
          loggerInstance = new Logger({
            mode: 'PROD',
            dirpath: app.getPath('userData'),
            logName: 'ANDB-UI'
          });
        }

        if (loggerInstance) {
          (global as any).logger = loggerInstance;
        }
      } catch (e) {
        // Silently fail logger init
      }

      // Create container with config
      const container = new Container(config)
      const services = container.getServices()

      // Execute operation based on type
      switch (operation) {
        case 'export':
          return await this.executeExport(services, options)

        case 'compare':
          if (!targetConn) throw new Error('Target connection is required for comparison')
          return await this.executeCompare(services, options, config, targetConn.environment, sourceConn, targetConn)

        case 'migrate':
          if (!targetConn) throw new Error('Target connection is required for migration')

          // DBA Rule: Cannot migrate into a static SQL Dump file
          if ((targetConn as any).type === 'dump' || targetConn.host.includes('.sql')) {
            throw new Error(`Migration forbidden: Target '${targetConn.name}' is a static SQL Dump file. You can only migrate INTO a live database server.`)
          }

          return await this.executeMigrate(services, options, targetConn.environment, sourceConn)

        case 'generate':
          throw new Error('Generate operation is only available via andb-cli')

        default:
          throw new Error(`Unknown operation: ${operation}`)
      }
    } catch (error: any) {
      if ((global as any).logger) (global as any).logger.error('[AndbBuilder] execute error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    } finally {
      // Restore original CWD
      try {
        process.chdir(originalCwd)
      } catch (e) {
        // Silently fail CWD restore
      }
    }
  }

  /**
   * Execute export operation
   */
  private static async executeExport(services: any, options: any) {
    const {
      type = 'tables',
      environment,
      name = null
    } = options

    const ddlType = type.toLowerCase()

    try {
      const exportFn = services.exporter(ddlType, name)
      const result = await exportFn(environment)
      return result
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Execute compare operation
   */
  private static async executeCompare(
    services: any,
    options: any,
    config: any,
    destEnv: string,
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection
  ) {
    const {
      type = 'tables',
      name = null
    } = options

    const ddlType = type.toLowerCase()

    try {
      // PROACTIVE: If source or target is a dump, we MUST re-export (re-parse) to avoid stale cache
      const srcEnv = config.getSourceEnv(destEnv)

      if ((sourceConn as any).type === 'dump' || sourceConn.host.includes('.sql')) {
        if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Auto-refreshing dump source: ${sourceConn.host}`)
        await this.clearConnectionData(sourceConn)
        await this.executeExport(services, { type: ddlType, environment: srcEnv, name })
      }

      if ((targetConn as any).type === 'dump' || targetConn.host.includes('.sql')) {
        if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Auto-refreshing dump target: ${targetConn.host}`)
        await this.clearConnectionData(targetConn)
        await this.executeExport(services, { type: ddlType, environment: destEnv, name })
      }

      const compareFn = services.comparator(ddlType, name)
      // Use destEnv passed from execute(), which should be the *aliased* name if applicable
      await compareFn(destEnv)

      const dbName = config.getDBName(srcEnv)

      // Read and return results from SQLite
      const storage = this.getSQLiteStorage();
      const normalizedSrcEnv = srcEnv.toUpperCase();
      const normalizedDestEnv = destEnv.toUpperCase();
      const destDbName = config.getDBName(normalizedDestEnv);

      const results = await storage.getComparisons(normalizedSrcEnv, normalizedDestEnv, dbName, ddlType);

      const mapped = await Promise.all(results.map(async (res: any) => {
        const itemName = res.name;
        const alterStmts = res.ddl;

        return {
          name: itemName,
          status: res.status,
          type: res.type.toUpperCase(),
          ddl: Array.isArray(alterStmts) ? alterStmts : (alterStmts ? [alterStmts] : []),
          diff: {
            source: await storage.getDDL(srcEnv, dbName, ddlType, itemName),
            target: await storage.getDDL(destEnv, destDbName, ddlType, itemName)
          }
        };
      }));

      return mapped
    } catch (error: any) {
      throw error
    }
  }


  /**
   * Execute migrate operation
   */
  private static async executeMigrate(services: any, options: any, destEnv: string, sourceConn: DatabaseConnection) {
    const {
      type = 'tables',
      status = 'NEW',
      name = null,
      dryRun = false
    } = options

    const ddlType = type.toLowerCase()

    // Optimization: Check comparison cache FIRST for dry-run of specific items
    // This avoids redundant re-comparison in andb-core and addresses the "lấy từ map migrate" concern
    if (dryRun && name) {
      if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Dry-run for ${name}: Checking comparison cache...`)
      try {
        const storage = this.getSQLiteStorage()
        const srcEnv = options.sourceEnv || sourceConn.environment
        const dbName = sourceConn.database
        const comparisons = await storage.getComparisons(srcEnv.toUpperCase(), destEnv.toUpperCase(), dbName, ddlType)
        const match = comparisons.find((c: any) => c.name === name)

        if (match && match.alterStatements && match.alterStatements !== '[]' && match.alterStatements !== '""') {
          let statements = match.alterStatements
          try {
            if (typeof statements === 'string' && statements.startsWith('[') && statements.endsWith(']')) {
              statements = JSON.parse(statements)
            }
          } catch (e) { }

          if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Cache hit for ${name}, returning saved alter statements from database.`)
          return statements
        }
        if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] No cached alter statements found for ${name} in database.`)
      } catch (e) {
        if ((global as any).logger) (global as any).logger.warn(`[AndbBuilder] Cache check failed for ${name}:`, e)
      }
    }

    const migrateFn = services.migrator(ddlType, status.toUpperCase(), name)

    if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Executing native migrate for ${ddlType} ${name || 'ALL'} (status: ${status}, dryRun: ${!!dryRun})`)

    const result = await migrateFn(destEnv, options)

    if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Migrate raw result from core:`, result)

    // DRY RUN fallback: If core returns nothing/0, try to fetch the alter statements from our comparisons table
    if (options.dryRun && (result === 0 || result === '0' || !result)) {
      if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Dry run returned nothing for ${name}, trying database fallback...`)
      try {
        const storage = this.getSQLiteStorage()
        const srcEnv = options.sourceEnv || sourceConn.environment
        const dbName = sourceConn.database
        const comparisons = await storage.getComparisons(srcEnv.toUpperCase(), destEnv.toUpperCase(), dbName, ddlType)
        const match = comparisons.find((c: any) => c.name === name)

        if (match && match.alterStatements) {
          if ((global as any).logger) (global as any).logger.info(`[AndbBuilder] Found cached alter statements for ${name} in database`)

          let statements = match.alterStatements
          try {
            // It might be stored as a JSON array string
            if (typeof statements === 'string' && statements.startsWith('[') && statements.endsWith(']')) {
              statements = JSON.parse(statements)
            }
          } catch (e) { }

          return statements
        }
      } catch (e) {
        if ((global as any).logger) (global as any).logger.error(`[AndbBuilder] Database fallback failed:`, e)
      }
    }

    return result
  }

  /**
   * Fetch saved comparison results from SQLite without re-running comparison
   */
  static async getSavedComparisonResults(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection,
    type: string
  ): Promise<any> {
    const ddlType = type.toLowerCase()
    const storage = this.getSQLiteStorage()

    const srcEnv = sourceConn.environment
    const destEnv = targetConn.environment
    const dbName = sourceConn.database
    const destDbName = targetConn.database

    const results = await storage.getComparisons(srcEnv, destEnv, dbName, ddlType);

    const mapped = await Promise.all(results.map(async (res: any) => {
      let alterStmts = res.alter_statements
      try {
        if (alterStmts && typeof alterStmts === 'string' && alterStmts.startsWith('[')) {
          alterStmts = JSON.parse(alterStmts)
        }
      } catch (e) { }

      return {
        name: res.name,
        status: res.status,
        type: res.type.toUpperCase(),
        ddl: Array.isArray(alterStmts) ? alterStmts : (alterStmts ? [alterStmts] : []),
        diff: {
          source: await storage.getDDL(srcEnv, dbName, ddlType, res.name),
          target: await storage.getDDL(destEnv, destDbName, ddlType, res.name)
        }
      }
    }))

    return mapped
  }


  /**
   * Clear cached data for a specific connection
   */
  static async clearConnectionData(connection: DatabaseConnection) {
    const storage = this.getSQLiteStorage()
    const result = await storage.clearDataForConnection(connection.environment, connection.database)

    if ((global as any).logger) {
      (global as any).logger.info(`[AndbBuilder] Cleared connection data for ${connection.environment}:${connection.database}`);
      (global as any).logger.info(`[AndbBuilder]   - Deleted ${result.ddlCount} DDL records`);
      (global as any).logger.info(`[AndbBuilder]   - Deleted ${result.comparisonCount} Comparison records`);
    }

    return result
  }

  /**
   * Fetch snapshots for an object
   */
  static async getSnapshots(environment: string, database: string, type: string, name: string) {
    const storage = this.getSQLiteStorage()
    return await storage.getSnapshots(environment, database, type.toUpperCase(), name)
  }

  /**
   * Fetch migration history
   */
  static async getMigrationHistory(limit: number = 100) {
    const storage = this.getSQLiteStorage()
    return await storage.getMigrationHistory(limit)
  }

  /**
   * Fetch all snapshots globally
   */
  static async getAllSnapshots(limit: number = 200) {
    const storage = this.getSQLiteStorage()
    return await storage.getAllSnapshots(limit)
  }

  /**
   * Create a manual snapshot of an object
   */
  static async createManualSnapshot(connection: DatabaseConnection, type: string, name: string) {
    if ((global as any).logger) (global as any).logger.info(`Starting manual snapshot for ${type}:${name}`)

    const config = this.buildConfig(connection, null)
    const container = new Container(config)
    const services = container.getServices()

    // 1. Fetch current DDL from DB (this saves it into ddl_exports internal table)
    await this.executeExport(services, { type, environment: connection.environment, name })

    const storage = this.getSQLiteStorage()
    // 2. Read from our shared storage to get the fresh content
    const ddl = await storage.getDDL(connection.environment, connection.database, type, name)

    if (ddl) {
      if ((global as any).logger) (global as any).logger.info(`DDL fetched for ${name}, saving snapshot...`)
      // 3. Save as snapshot in ddl_snapshots table
      return await storage.saveSnapshot({
        environment: connection.environment,
        database: connection.database,
        type: type.toUpperCase(),
        name: name,
        content: ddl,
        versionTag: `manual-${new Date().getTime()}`
      })
    }

    if ((global as any).logger) (global as any).logger.error(`Could not find DDL in storage for ${connection.environment}:${connection.database}:${type}:${name}`)
    throw new Error('Could not fetch DDL for snapshot (empty content in storage)')
  }

  /**
   * Restore a historical snapshot to the database
   */
  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any) {
    if ((global as any).logger) (global as any).logger.info(`Starting snapshot restore for ${snapshot.ddl_type}:${snapshot.ddl_name}`)

    const { ddl_type, ddl_name, ddl_content } = snapshot
    const config = this.buildConfig(connection, null)
    const container = new Container(config)
    const services = container.getServices()

    // 1. Take a "pre-restore" snapshot just in case (SAFETY FIRST!)
    try {
      await this.createManualSnapshot(connection, ddl_type, ddl_name)
    } catch (e) {
      if ((global as any).logger) (global as any).logger.warn('Could not take safety snapshot before restore, continuing anyway...', e)
    }

    // 2. Prepare queries
    let dropQuery = ''
    const type = ddl_type.toUpperCase()

    // SAFETY: Never DROP tables directly because we lose data!
    if (type === 'TABLES' || type === 'TABLE') {
      throw new Error('Direct restoration of TABLES is disabled to prevent permanent data loss. Please copy the DDL and run a manual ALTER statement instead.')
    }

    if (type === 'PROCEDURES' || type === 'PROCEDURE') dropQuery = `DROP PROCEDURE IF EXISTS \`${ddl_name}\`;`
    else if (type === 'FUNCTIONS' || type === 'FUNCTION') dropQuery = `DROP FUNCTION IF EXISTS \`${ddl_name}\`;`
    else if (type === 'VIEWS' || type === 'VIEW') dropQuery = `DROP VIEW IF EXISTS \`${ddl_name}\`;`
    else if (type === 'TRIGGERS' || type === 'TRIGGER') dropQuery = `DROP TRIGGER IF EXISTS \`${ddl_name}\`;`

    // 3. Get connection and execute
    const mysql = require('mysql2/promise')
    const conn = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      database: connection.database,
      multipleStatements: true
    })

    try {
      if (dropQuery) {
        if ((global as any).logger) (global as any).logger.info(`Executing: ${dropQuery}`)
        await conn.query(dropQuery)
      }

      if ((global as any).logger) (global as any).logger.info(`Applying DDL content...`)
      const finalDDL = services.replacer ? services.replacer.replaceWithEnv(ddl_content, connection.environment) : ddl_content
      await conn.query(finalDDL)

      // 4. Update the ddl_exports table so UI shows the new version
      this.getSQLiteStorage().saveDDL({
        environment: connection.environment,
        database: connection.database,
        type: type,
        name: ddl_name,
        content: finalDDL
      })

      return { success: true }
    } finally {
      await conn.end()
    }
  }

  /**
   * Test if andb-core is available and working
   */
  static async test(): Promise<boolean> {
    try {
      const { Container } = require('@the-andb/core')
      return !!Container
    } catch (error) {
      return false
    }
  }
}

export default AndbBuilder
