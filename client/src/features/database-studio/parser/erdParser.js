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
        const options = optionStr ? optionStr.split(',').map(s => s.trim()) : [];
        const lowerOpts = options.map(o => o.toLowerCase());

        const isPk = lowerOpts.includes('pk');
        const isIncrement = lowerOpts.includes('increment');
        const isUnique = lowerOpts.includes('unique');
        const isNullable = !lowerOpts.includes('notnull');

        // MongoDB-specific flags
        const isRequired = lowerOpts.includes('required');
        const isTrim = lowerOpts.includes('trim');
        const isLowercase = lowerOpts.includes('lowercase');
        const isUppercase = lowerOpts.includes('uppercase');
        const isIndex = lowerOpts.includes('index');

        let defaultVal = '';
        const defaultOpt = options.find(opt => opt.toLowerCase().startsWith('default:'));
        if (defaultOpt) {
          defaultVal = defaultOpt.substring(8).replace(/['"]/g, '').trim();
        }

        let minLength = '';
        const minLenOpt = lowerOpts.find(opt => opt.startsWith('minlength:'));
        if (minLenOpt) {
          minLength = minLenOpt.substring(10).trim();
        }

        let maxLength = '';
        const maxLenOpt = lowerOpts.find(opt => opt.startsWith('maxlength:'));
        if (maxLenOpt) {
          maxLength = maxLenOpt.substring(10).trim();
        }

        let enumValues = '';
        const enumOpt = options.find(opt => opt.toLowerCase().startsWith('enum:'));
        if (enumOpt) {
          const enumStart = options.indexOf(enumOpt);
          enumValues = enumOpt.substring(5).trim();
          // Enum values may contain commas that the naive split broke apart.
          // Merge any following tokens that are not new option keywords.
          for (let j = enumStart + 1; j < options.length; j++) {
            const next = options[j];
            if (next.includes(':')) break;
            if (['pk', 'increment', 'unique', 'notnull', 'required', 'trim', 'lowercase', 'uppercase', 'index'].includes(next.toLowerCase())) break;
            enumValues += ' ' + next.trim();
            options.splice(j, 1);
            j -= 1;
          }
        }

        // Inline reference check
        // Format: [ref: > roles.id] or [ref: > Roles]
        let ref = '';
        const refOpt = options.find(opt => opt.toLowerCase().startsWith('ref:'));
        if (refOpt) {
          const refBody = refOpt.substring(4).trim();
          const inlineRefRegex = /^([><-])\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/;
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

            ref = `${toTable}.${toField}`;
          } else {
            const bareRefRegex = /^([><-])\s*([a-zA-Z0-9_]+)$/;
            const bareRefMatch = refBody.match(bareRefRegex);
            ref = bareRefMatch ? bareRefMatch[2] : refBody;
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
          // MongoDB-specific
          isRequired,
          isTrim,
          isLowercase,
          isUppercase,
          isIndex,
          minLength,
          maxLength,
          enumValues,
          ref,
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
      if (field.isUnique) opts.push('unique');

      // MongoDB uses `required`; relational models use `notnull`
      if (field.isRequired) opts.push('required');
      else if (field.isNullable === false || field.isNotNull) opts.push('notnull');

      if (field.defaultVal) opts.push(`default: "${field.defaultVal}"`);

      // MongoDB specific options
      if (field.isTrim) opts.push('trim');
      if (field.isLowercase) opts.push('lowercase');
      if (field.isUppercase) opts.push('uppercase');
      if (field.isIndex) opts.push('index');
      if (field.minLength) opts.push(`minlength: ${field.minLength}`);
      if (field.maxLength) opts.push(`maxlength: ${field.maxLength}`);
      if (field.enumValues) opts.push(`enum: ${field.enumValues}`);
      if (field.ref) {
        const hasInlineRel = (relationships || []).some(r => r.fromTable === table.name && r.fromField === field.name);
        if (!hasInlineRel) opts.push(`ref: > ${field.ref}`);
      }

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
