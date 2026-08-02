/**
 * ORM Model Generator for Database Modeling Studio.
 * Supports: Prisma, Drizzle, Mongoose, Sequelize, and TypeORM.
 */

export function generateORM(tables = [], relationships = [], orm = 'prisma') {
  if (!tables.length) return '// No tables defined in model.\n';

  switch (orm.toLowerCase()) {
    case 'drizzle':
      return generateDrizzle(tables, relationships);
    case 'mongoose':
      return generateMongoose(tables, relationships);
    case 'sequelize':
      return generateSequelize(tables, relationships);
    case 'typeorm':
      return generateTypeORM(tables, relationships);
    case 'prisma':
    default:
      return generatePrisma(tables, relationships);
  }
}

// ── Prisma Model Generator ──
function generatePrisma(tables, relationships) {
  let code = `// Prisma Schema File\n// Generated on ${new Date().toISOString().split('T')[0]}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

  tables.forEach((table) => {
    code += `model ${capitalize(table.name)} {\n`;
    
    // Process columns
    table.fields.forEach((field) => {
      let line = `  ${field.name}  `;
      
      // Type mapping
      const t = field.type.toLowerCase();
      if (t.startsWith('integer') || t === 'int') line += 'Int';
      else if (t === 'string' || t === 'varchar') line += 'String';
      else if (t === 'text') line += 'String';
      else if (t === 'timestamp' || t === 'datetime') line += 'DateTime';
      else if (t === 'boolean') line += 'Boolean';
      else line += capitalize(field.type);

      if (field.isNullable) {
        line += '?';
      }

      const attributes = [];
      if (field.isPk) attributes.push('@id');
      if (field.isIncrement) attributes.push('@default(autoincrement())');
      if (field.isUnique) attributes.push('@unique');
      if (field.defaultVal) {
        const isString = ['varchar', 'string', 'text'].includes(t);
        const val = isString ? `"${field.defaultVal}"` : field.defaultVal;
        attributes.push(`@default(${val})`);
      }

      if (attributes.length) {
        line += ` ${attributes.join(' ')}`;
      }

      code += line + '\n';
    });

    // Relations mapping in Prisma
    const modelRelations = relationships.filter(r => r.fromTable === table.name);
    modelRelations.forEach((rel) => {
      code += `  ${rel.toTable}  ${capitalize(rel.toTable)}  @relation(fields: [${rel.fromField}], references: [${rel.toField}])\n`;
    });

    code += `}\n\n`;
  });

  return code;
}

// ── Mongoose Model Generator ──
function mongooseFieldType(field) {
  const t = (field.type || '').toLowerCase();
  if (t.startsWith('integer') || t === 'int' || t === 'number') return 'Number';
  if (t === 'boolean') return 'Boolean';
  if (t === 'timestamp' || t === 'datetime' || t === 'date') return 'Date';
  if (t === 'objectid') return 'mongoose.Schema.Types.ObjectId';
  if (t === 'decimal128') return 'mongoose.Schema.Types.Decimal128';
  if (t === 'mixed') return 'mongoose.Schema.Types.Mixed';
  if (t === 'buffer') return 'Buffer';
  if (t === 'array') return 'Array';
  if (t === 'map') return 'Map';
  return 'String';
}

function generateMongoose(tables, relationships) {
  let code = `import mongoose from 'mongoose';\n\n`;

  tables.forEach((table) => {
    code += `// ${capitalize(table.name)} Schema\nconst ${table.name}Schema = new mongoose.Schema({\n`;
    
    table.fields.forEach((field) => {
      // _id is auto-managed by Mongoose
      if (field.name === '_id') return;

      code += `  ${field.name}: {\n`;

      // If this is a foreign key, link it as an ObjectId Ref
      const rel = relationships.find(r => r.fromTable === table.name && r.fromField === field.name);
      if (rel) {
        code += `    type: mongoose.Schema.Types.ObjectId,\n`;
        code += `    ref: '${capitalize(rel.toTable)}',\n`;
      } else if (field.ref) {
        code += `    type: mongoose.Schema.Types.ObjectId,\n`;
        code += `    ref: '${capitalize(field.ref.split('.')[0])}',\n`;
      } else {
        code += `    type: ${mongooseFieldType(field)},\n`;
      }

      if (field.isRequired || field.isPk) code += `    required: true,\n`;
      if (field.isUnique) code += `    unique: true,\n`;
      if (field.isTrim) code += `    trim: true,\n`;
      if (field.isLowercase) code += `    lowercase: true,\n`;
      if (field.isUppercase) code += `    uppercase: true,\n`;
      if (field.isIndex) code += `    index: true,\n`;
      if (field.minLength) code += `    minlength: ${field.minLength},\n`;
      if (field.maxLength) code += `    maxlength: ${field.maxLength},\n`;
      if (field.enumValues) {
        const vals = String(field.enumValues)
          .split(/[,\s]+/)
          .map(v => v.trim())
          .filter(Boolean);
        code += `    enum: [${vals.map(v => `'${v}'`).join(', ')}],\n`;
      }
      if (field.defaultVal) {
        const dv = String(field.defaultVal);
        const isExpression = /[.()]/.test(dv) || /^\d+(\.\d+)?$/.test(dv);
        code += `    default: ${isExpression ? dv : `'${dv}'`},\n`;
      }

      code += `  },\n`;
    });

    code += `}, {\n  timestamps: true\n});\n\n`;
    code += `export const ${capitalize(table.name)} = mongoose.model('${capitalize(table.name)}', ${table.name}Schema);\n\n`;
  });

  return code;
}

// ── Drizzle Schema Generator ──
function generateDrizzle(tables, relationships) {
  let code = `import { pgTable, serial, text, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';\n\n`;

  tables.forEach((table) => {
    code += `export const ${table.name} = pgTable('${table.name}', {\n`;
    
    table.fields.forEach((field) => {
      let line = `  ${field.name}: `;
      
      const t = field.type.toLowerCase();
      if (field.isIncrement) {
        line += `serial('${field.name}')`;
      } else if (t.startsWith('integer') || t === 'int') {
        line += `integer('${field.name}')`;
      } else if (t === 'boolean') {
        line += `boolean('${field.name}')`;
      } else if (t === 'timestamp' || t === 'datetime') {
        line += `timestamp('${field.name}')`;
      } else if (t === 'text') {
        line += `text('${field.name}')`;
      } else {
        line += `varchar('${field.name}', { length: 255 })`;
      }

      if (field.isPk && !field.isIncrement) line += '.primaryKey()';
      if (!field.isNullable) line += '.notNull()';
      if (field.isUnique) line += '.unique()';

      const rel = relationships.find(r => r.fromTable === table.name && r.fromField === field.name);
      if (rel) {
        line += `.references(() => ${rel.toTable}.${rel.toField})`;
      }

      code += line + ',\n';
    });

    code += `});\n\n`;
  });

  return code;
}

// ── Sequelize Model Generator ──
function generateSequelize(tables, relationships) {
  let code = `import { DataTypes } from 'sequelize';\nimport { sequelize } from '../config/database.js';\n\n`;

  tables.forEach((table) => {
    code += `export const ${capitalize(table.name)} = sequelize.define('${capitalize(table.name)}', {\n`;
    
    table.fields.forEach((field) => {
      code += `  ${field.name}: {\n`;
      
      const t = field.type.toLowerCase();
      let sType = 'DataTypes.STRING';
      if (t.startsWith('integer') || t === 'int') sType = 'DataTypes.INTEGER';
      else if (t === 'boolean') sType = 'DataTypes.BOOLEAN';
      else if (t === 'timestamp' || t === 'datetime') sType = 'DataTypes.DATE';
      else if (t === 'text') sType = 'DataTypes.TEXT';

      code += `    type: ${sType},\n`;
      if (field.isPk) code += `    primaryKey: true,\n`;
      if (field.isIncrement) code += `    autoIncrement: true,\n`;
      code += `    allowNull: ${field.isNullable},\n`;
      if (field.isUnique) code += `    unique: true,\n`;
      if (field.defaultVal) {
        const val = typeof field.defaultVal === 'string' ? `'${field.defaultVal}'` : field.defaultVal;
        code += `    defaultValue: ${val},\n`;
      }

      code += `  },\n`;
    });

    code += `});\n\n`;
  });

  // Relationships
  if (relationships.length) {
    code += `// Sequelize Associations\n`;
    relationships.forEach((rel) => {
      code += `${capitalize(rel.fromTable)}.belongsTo(${capitalize(rel.toTable)}, { foreignKey: '${rel.fromField}' });\n`;
      code += `${capitalize(rel.toTable)}.hasMany(${capitalize(rel.fromTable)}, { foreignKey: '${rel.fromField}' });\n`;
    });
  }

  return code;
}

// ── TypeORM Entity Generator ──
function generateTypeORM(tables, relationships) {
  let code = `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';\n\n`;

  tables.forEach((table) => {
    code += `@Entity('${table.name}')\nexport class ${capitalize(table.name)} {\n`;
    
    table.fields.forEach((field) => {
      // Primary keys
      if (field.isPk) {
        if (field.isIncrement) {
          code += `  @PrimaryGeneratedColumn()\n  ${field.name}: number;\n\n`;
        } else {
          code += `  @PrimaryGeneratedColumn('uuid')\n  ${field.name}: string;\n\n`;
        }
        return;
      }

      const t = field.type.toLowerCase();
      let oType = 'string';
      if (t.startsWith('integer') || t === 'int') oType = 'number';
      else if (t === 'boolean') oType = 'boolean';
      else if (t === 'timestamp' || t === 'datetime') oType = 'Date';

      const rel = relationships.find(r => r.fromTable === table.name && r.fromField === field.name);
      if (rel) {
        code += `  @ManyToOne(() => ${capitalize(rel.toTable)})\n`;
        code += `  @JoinColumn({ name: '${field.name}' })\n`;
        code += `  ${rel.toTable}: ${capitalize(rel.toTable)};\n\n`;
      } else {
        const nullableAttr = field.isNullable ? ', nullable: true' : '';
        const uniqueAttr = field.isUnique ? ', unique: true' : '';
        code += `  @Column({ name: '${field.name}'${nullableAttr}${uniqueAttr} })\n`;
        code += `  ${field.name}: ${oType};\n\n`;
      }
    });

    code += `}\n\n`;
  });

  return code;
}

// Helpers
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
