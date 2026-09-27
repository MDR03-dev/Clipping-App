/*
 * Importers/callers: This file will be imported by the server controllers to access the database.
 * Affected API: Database client instance.
 * Data schemas: DatabaseClient instance.
 * Verbatim instruction: Continue building out reframe-engine; add database index per Stage 6 spec.
 */

import { DatabaseClient } from './client';
import { db } from './client';

// Re-export for convenience
export { DatabaseClient, db };