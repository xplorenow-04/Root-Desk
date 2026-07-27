/**
 * Reverse Engineering Module.
 * Parses SQL DDL statements (specifically CREATE TABLE) to generate ER Diagram structured JSON.
 */

export function reverseEngineerSQL(sqlCode) {
  const tables = [];
  const relationships = [];
  const errors = [];

  if (!sqlCode || !sqlCode.trim()) {
    return { tables, relationships, errors };
  }

  // Clean SQL comments
  const cleanSql = sqlCode
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Find CREATE TABLE statements
  // Handles multi-line statements
  const createTableRegex = /create\s+table\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const tableName = match[1];
    const body = match[2];

    const fields = [];

    // Split body by commas, but skip commas inside brackets like VARCHAR(255) or DECIMAL(10, 2)
    const lines = splitBodyColumns(body);

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Check if it is a standalone Foreign Key constraint
      // Format: FOREIGN KEY (user_id) REFERENCES users(id)
      const standaloneFkRegex = /foreign\s+key\s*\(([a-zA-Z0-9_]+)\)\s*references\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i;
      const fkMatch = cleanLine.match(standaloneFkRegex);
      if (fkMatch) {
        const [_, localField, foreignTable, foreignField] = fkMatch;
        relationships.push({
          id: `rel_${tableName}_${localField}_${foreignTable}_${foreignField}`,
          fromTable: tableName,
          fromField: localField,
          toTable: foreignTable,
          toField: foreignField,
          type: 'many-to-one', // Default assumption
        });
        return;
      }

      // Check if it is a primary key constraint definition
      // Format: PRIMARY KEY (id) or PRIMARY KEY (col1, col2)
      if (cleanLine.toUpperCase().startsWith('PRIMARY KEY')) {
        const pkColMatch = cleanLine.match(/primary\s+key\s*\(([^)]+)\)/i);
        if (pkColMatch) {
          const pkCols = pkColMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
          fields.forEach((f) => {
            if (pkCols.includes(f.name)) {
              f.isPk = true;
            }
          });
        }
        return;
      }

      // Standard Column parsing
      // Format: id integer PRIMARY KEY AUTOINCREMENT
      const colRegex = /^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+)([\s\S]*)$/i;
      const colMatch = cleanLine.match(colRegex);

      if (colMatch) {
        const name = colMatch[1];
        const type = colMatch[2];
        const rest = colMatch[3].toUpperCase();

        const isPk = rest.includes('PRIMARY KEY');
        const isIncrement = rest.includes('AUTOINCREMENT') || rest.includes('IDENTITY') || rest.includes('SERIAL') || rest.includes('AUTO_INCREMENT');
        const isUnique = rest.includes('UNIQUE');
        const isNullable = !rest.includes('NOT NULL');

        let defaultVal = '';
        const defaultMatch = rest.match(/DEFAULT\s+([^ ]+)/i);
        if (defaultMatch) {
          defaultVal = defaultMatch[1].replace(/['"]/g, '').trim();
        }

        // Inline Reference check
        // Format: REFERENCES targetTable(id)
        const inlineRefRegex = /REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i;
        const inlineRefMatch = rest.match(inlineRefRegex);
        if (inlineRefMatch) {
          const [_, foreignTable, foreignField] = inlineRefMatch;
          relationships.push({
            id: `rel_${tableName}_${name}_${foreignTable}_${foreignField}`,
            fromTable: tableName,
            fromField: name,
            toTable: foreignTable,
            toField: foreignField,
            type: 'many-to-one',
          });
        }

        fields.push({
          name,
          type,
          isPk,
          isIncrement,
          isUnique,
          isNullable,
          defaultVal,
        });
      }
    });

    tables.push({
      name: tableName,
      fields,
    });
  }

  // Parse ALTER TABLE statements for foreign keys
  // Format: ALTER TABLE users ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id)
  const alterFkRegex = /alter\s+table\s+([a-zA-Z0-9_]+)\s+add\s+(?:constraint\s+[a-zA-Z0-9_]+\s+)?foreign\s+key\s*\(([a-zA-Z0-9_]+)\)\s*references\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/gi;
  let alterMatch;
  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const [_, fromTable, fromField, toTable, toField] = alterMatch;
    relationships.push({
      id: `rel_${fromTable}_${fromField}_${toTable}_${toField}`,
      fromTable,
      fromField,
      toTable,
      toField,
      type: 'many-to-one',
    });
  }

  return { tables, relationships, errors };
}

/**
 * Split columns in CREATE TABLE by commas, keeping parentheses grouping safe.
 */
function splitBodyColumns(body) {
  const parts = [];
  let current = '';
  let bracketDepth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') bracketDepth++;
    if (char === ')') bracketDepth--;

    if (char === ',' && bracketDepth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}
