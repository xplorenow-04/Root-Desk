/**
 * Custom parser/generator for DBML (Database Markup Language) subset.
 * Supports:
 * - Table definition: Table name { field type [options] }
 * - References: Ref: table.field > table.field (or < or -)
 * - Column options: pk, increment, unique, notnull, default: value
 */

/**
 * Parse a DBML schema string into structured JSON: { tables: [], relationships: [], errors: [] }
 */
export function parseDBML(code) {
  const tables = [];
  const relationships = [];
  const errors = [];

  if (!code || !code.trim()) {
    return { tables, relationships, errors };
  }

  const lines = code.split('\n');
  let currentTable = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNumber = i + 1;

    // Skip empty lines or comment lines
    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }

    // Parse Standalone Ref
    // Format: Ref: users.role_id > roles.id
    if (line.toLowerCase().startsWith('ref:')) {
      const refBody = line.substring(4).trim();
      const refRegex = /^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*([><-])\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/;
      const match = refBody.match(refRegex);

      if (match) {
        const [_, fromTable, fromField, relOp, toTable, toField] = match;
        let type = 'many-to-one';
        if (relOp === '<') type = 'one-to-many';
        if (relOp === '-') type = 'one-to-one';

        relationships.push({
          id: `rel_${fromTable}_${fromField}_${toTable}_${toField}`,
          fromTable,
          fromField,
          toTable,
          toField,
          type,
        });
      } else {
        errors.push({
          line: lineNumber,
          message: 'Invalid Ref syntax. Format should be: Ref: table.field > table.field',
          raw: line,
        });
      }
      continue;
    }

    // Parse Table definition start
    // Format: Table users {
    if (line.toLowerCase().startsWith('table ')) {
      if (currentTable) {
        errors.push({
          line: lineNumber,
          message: `Unexpected 'Table' start. Table '${currentTable.name}' is already open. Missing closing bracket '}'.`,
          raw: line,
        });
      }

      const tableRegex = /^table\s+([a-zA-Z0-9_]+)\s*\{?$/i;
      const match = line.match(tableRegex);

      if (match) {
        currentTable = {
          name: match[1],
          fields: [],
        };
      } else {
        errors.push({
          line: lineNumber,
          message: 'Invalid Table name or declaration. Format: Table name {',
          raw: line,
        });
      }
      continue;
    }

    // Parse closing brace of table
    if (line === '}') {
      if (currentTable) {
        tables.push(currentTable);
        currentTable = null;
      } else {
        errors.push({
          line: lineNumber,
          message: "Unexpected closing bracket '}'. No table is currently open.",
          raw: line,
        });
      }
      continue;
    }

    // Parse columns inside active table
    if (currentTable) {
      // Split field name and data type
      // Format: id integer [pk, increment]
      const fieldRegex = /^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+)(?:\s+\[(.*)\])?$/;
      const match = line.match(fieldRegex);

      if (match) {
        const [_, fieldName, fieldType, optionStr] = match;
        const options = optionStr ? optionStr.split(',').map(s => s.trim().toLowerCase()) : [];

        const isPk = options.includes('pk');
        const isIncrement = options.includes('increment');
        const isUnique = options.includes('unique');
        const isNullable = !options.includes('notnull');

        let defaultVal = '';
        const defaultOpt = options.find(opt => opt.startsWith('default:'));
        if (defaultOpt) {
          defaultVal = defaultOpt.substring(8).replace(/['"]/g, '').trim();
        }

        // Inline reference check
        // Format: [ref: > roles.id]
        const refOpt = options.find(opt => opt.startsWith('ref:'));
        if (refOpt) {
          const inlineRefRegex = /^ref:\s*([><-])\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/;
          const refBody = refOpt.substring(4).trim();
          const refMatch = refBody.match(inlineRefRegex);
          if (refMatch) {
            const [__, relOp, toTable, toField] = refMatch;
            let type = 'many-to-one';
            if (relOp === '<') type = 'one-to-many';
            if (relOp === '-') type = 'one-to-one';

            relationships.push({
              id: `rel_${currentTable.name}_${fieldName}_${toTable}_${toField}`,
              fromTable: currentTable.name,
              fromField: fieldName,
              toTable,
              toField,
              type,
            });
          }
        }

        currentTable.fields.push({
          name: fieldName,
          type: fieldType,
          isPk,
          isIncrement,
          isUnique,
          isNullable,
          defaultVal,
        });
      } else {
        errors.push({
          line: lineNumber,
          message: 'Invalid column syntax. Format should be: column_name data_type [options]',
          raw: line,
        });
      }
    } else {
      errors.push({
        line: lineNumber,
        message: 'Statement found outside Table container block.',
        raw: rawLine,
      });
    }
  }

  // If file ended but table is still open
  if (currentTable) {
    errors.push({
      line: lines.length,
      message: `File ended before closing table '${currentTable.name}'. Missing closing bracket '}'.`,
      raw: '',
    });
    tables.push(currentTable);
  }

  return { tables, relationships, errors };
}

/**
 * Format JSON schema data { tables, relationships } back to clean DBML code string
 */
export function generateDBML(tables = [], relationships = []) {
  let code = '';

  // 1. Format Tables
  tables.forEach((table) => {
    code += `Table ${table.name} {\n`;
    table.fields.forEach((field) => {
      const opts = [];
      if (field.isPk) opts.push('pk');
      if (field.isIncrement) opts.push('increment');
      if (!field.isNullable) opts.push('notnull');
      if (field.isUnique) opts.push('unique');
      if (field.defaultVal) opts.push(`default: "${field.defaultVal}"`);

      const optionsStr = opts.length ? ` [${opts.join(', ')}]` : '';
      code += `    ${field.name} ${field.type}${optionsStr}\n`;
    });
    code += '}\n\n';
  });

  // 2. Format Standalone Refs
  if (relationships.length) {
    relationships.forEach((rel) => {
      let op = '>';
      if (rel.type === 'one-to-many') op = '<';
      if (rel.type === 'one-to-one') op = '-';

      code += `Ref: ${rel.fromTable}.${rel.fromField} ${op} ${rel.toTable}.${rel.toField}\n`;
    });
  }

  return code.trim() + '\n';
}
