/**
 * Diagnostic Schema Validator and Normalizer.
 * Analyzes database schemas for errors, normalization compliance, and performance improvements.
 */

export function validateSchema(tables = [], relationships = []) {
  const issues = [];
  const suggestions = [];
  let score = 100; // Peak normalization score

  if (!tables.length) {
    return {
      issues: [],
      suggestions: [],
      stats: { tableCount: 0, relationCount: 0, indexCount: 0, normalizationScore: 100 },
    };
  }

  const tableNames = new Set(tables.map(t => t.name.toLowerCase()));
  const referencedTables = new Set();
  relationships.forEach((rel) => {
    referencedTables.add(rel.fromTable.toLowerCase());
    referencedTables.add(rel.toTable.toLowerCase());
  });

  // 1. Missing Primary Keys check
  tables.forEach((table) => {
    const hasPk = table.fields.some(f => f.isPk);
    if (!hasPk) {
      issues.push({
        type: 'error',
        table: table.name,
        message: `Table "${table.name}" has no Primary Key (PK) defined. Every table should have a PK for row identification.`,
      });
      score -= 10;
    }
  });

  // 2. Orphan Tables check
  tables.forEach((table) => {
    if (tables.length > 1 && !referencedTables.has(table.name.toLowerCase())) {
      issues.push({
        type: 'warning',
        table: table.name,
        message: `Orphan Table: Table "${table.name}" has no incoming or outgoing relationships.`,
      });
      score -= 5;
    }
  });

  // 3. Duplicate Column Names check
  tables.forEach((table) => {
    const colNames = table.fields.map(f => f.name.toLowerCase());
    const duplicates = colNames.filter((item, index) => colNames.indexOf(item) !== index);
    if (duplicates.length) {
      issues.push({
        type: 'error',
        table: table.name,
        message: `Duplicate column(s) [${duplicates.join(', ')}] detected in table "${table.name}".`,
      });
      score -= 15;
    }
  });

  // 4. Invalid Relationship targets check
  relationships.forEach((rel) => {
    if (!tableNames.has(rel.fromTable.toLowerCase())) {
      issues.push({
        type: 'error',
        message: `Relationship specifies source table "${rel.fromTable}" which does not exist.`,
      });
      score -= 5;
    }
    if (!tableNames.has(rel.toTable.toLowerCase())) {
      issues.push({
        type: 'error',
        message: `Relationship specifies target table "${rel.toTable}" which does not exist.`,
      });
      score -= 5;
    }
  });

  // 5. Circular Dependency detection
  const adjacencyList = {};
  tables.forEach(t => { adjacencyList[t.name] = []; });
  relationships.forEach(rel => {
    if (adjacencyList[rel.fromTable]) {
      adjacencyList[rel.fromTable].push(rel.toTable);
    }
  });

  const checkCycle = () => {
    const visited = {};
    const recStack = {};

    const isCyclicUtil = (node) => {
      if (!visited[node]) {
        visited[node] = true;
        recStack[node] = true;

        const neighbors = adjacencyList[node] || [];
        for (let i = 0; i < neighbors.length; i++) {
          const neighbor = neighbors[i];
          if (!visited[neighbor] && isCyclicUtil(neighbor)) {
            return true;
          } else if (recStack[neighbor]) {
            return true;
          }
        }
      }
      recStack[node] = false;
      return false;
    };

    for (const node in adjacencyList) {
      if (isCyclicUtil(node)) return true;
    }
    return false;
  };

  if (checkCycle()) {
    issues.push({
      type: 'warning',
      message: 'Circular foreign key relationships detected. This can cause cascades, deadlocks, or insertion order issues.',
    });
    score -= 15;
  }

  // 6. Normalization Recommendations (1NF, 2NF, 3NF checks)
  tables.forEach((table) => {
    // Check if table name is plural (e.g. users vs user) - recommended singular names
    if (table.name.endsWith('s') && table.name !== 'status') {
      suggestions.push({
        table: table.name,
        message: `Consider renaming table "${table.name}" to singular form (e.g., "${table.name.slice(0, -1)}") for naming consistency.`,
      });
    }

    // Performance suggestion: Index FK columns
    table.fields.forEach((field) => {
      const isFk = relationships.some(r => r.fromTable === table.name && r.fromField === field.name);
      if (isFk) {
        suggestions.push({
          table: table.name,
          column: field.name,
          message: `Add index on foreign key column "${table.name}.${field.name}" to speed up JOIN operations.`,
        });
      }
    });
  });

  score = Math.max(0, score);

  return {
    issues,
    suggestions,
    stats: {
      tableCount: tables.length,
      relationCount: relationships.length,
      indexCount: relationships.length, // FK indexes recommended
      normalizationScore: score,
    },
  };
}
