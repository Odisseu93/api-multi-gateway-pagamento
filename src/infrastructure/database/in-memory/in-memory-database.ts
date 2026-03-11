/**
 * In-Memory Database
 *
 * A lightweight, type-safe in-memory store used exclusively in tests.
 * It simulates auto-increment IDs, stores records in plain arrays,
 * and can be fully reset between test cases.
 */

export interface InMemoryTable<T extends { id?: number }> {
  records: T[]
  nextId: number
}

export class InMemoryDatabase {
  private tables: Map<string, InMemoryTable<any>> = new Map()

  /** Get or lazily create a table by name */
  private getTable<T extends { id?: number }>(name: string): InMemoryTable<T> {
    if (!this.tables.has(name)) {
      this.tables.set(name, { records: [], nextId: 1 })
    }
    return this.tables.get(name) as InMemoryTable<T>
  }

  /** Insert a record, assigning the next auto-increment id */
  insert<T extends { id?: number }>(tableName: string, record: Omit<T, 'id'>): T {
    const table = this.getTable<T>(tableName)
    const newRecord = { ...record, id: table.nextId++ } as T
    table.records.push(newRecord)
    return newRecord
  }

  /** Find all records in a table */
  findAll<T extends { id?: number }>(tableName: string): T[] {
    return [...this.getTable<T>(tableName).records]
  }

  /** Find a single record by id */
  findById<T extends { id?: number }>(tableName: string, id: number): T | null {
    const table = this.getTable<T>(tableName)
    return table.records.find((r) => r.id === id) ?? null
  }

  /** Find a single record matching a predicate */
  findOne<T extends { id?: number }>(tableName: string, predicate: (record: T) => boolean): T | null {
    const table = this.getTable<T>(tableName)
    return table.records.find(predicate) ?? null
  }

  /** Find all records matching a predicate */
  findMany<T extends { id?: number }>(tableName: string, predicate: (record: T) => boolean): T[] {
    const table = this.getTable<T>(tableName)
    return table.records.filter(predicate)
  }

  /** Update a record by id using a partial update object; throws if not found */
  update<T extends { id?: number }>(tableName: string, id: number, data: Partial<T>): T {
    const table = this.getTable<T>(tableName)
    const index = table.records.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in table "${tableName}"`)
    }
    table.records[index] = { ...table.records[index], ...data, id } as T
    return table.records[index]
  }

  /** Delete a record by id; throws if not found */
  delete<T extends { id?: number }>(tableName: string, id: number): void {
    const table = this.getTable<T>(tableName)
    const index = table.records.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in table "${tableName}"`)
    }
    table.records.splice(index, 1)
  }

  /** Wipe a specific table */
  clearTable(tableName: string): void {
    this.tables.set(tableName, { records: [], nextId: 1 })
  }

  /** Wipe all tables — call this in beforeEach to isolate tests */
  clearAll(): void {
    this.tables.clear()
  }
}
