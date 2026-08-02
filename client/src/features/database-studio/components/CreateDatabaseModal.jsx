import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Database,
  Key,
  Hash,
  FileCode,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Table2,
  BrainCircuit,
} from 'lucide-react';

// ── SQL data types ──
const SQL_TYPES = [
  'integer',
  'varchar',
  'text',
  'timestamp',
  'boolean',
  'date',
  'decimal',
  'uuid',
  'serial',
  'bigint',
  'float',
  'json',
  'jsonb',
];

// ── MongoDB data types ──
const MONGO_TYPES = [
  'String',
  'Number',
  'Boolean',
  'Date',
  'ObjectId',
  'Array',
  'Mixed',
  'Buffer',
  'Map',
  'Decimal128',
];

// ── Default field templates ──
function createDefaultSQLField(index) {
  return {
    name: index === 0 ? 'id' : `field_${index + 1}`,
    type: index === 0 ? 'integer' : 'varchar',
    isPk: index === 0,
    isNotNull: true,
    isUnique: false,
    isIncrement: index === 0,
    defaultVal: '',
    isIndex: false,
  };
}

function createDefaultMongoField(index) {
  return {
    name: index === 0 ? '_id' : `field_${index + 1}`,
    type: index === 0 ? 'ObjectId' : 'String',
    isRequired: index === 0,
    isUnique: false,
    isTrim: false,
    isLowercase: false,
    isUppercase: false,
    defaultVal: '',
    ref: '',
    minLength: '',
    maxLength: '',
    enumValues: '',
    isIndex: false,
  };
}

// ── Convert modal fields to DBML code ──
function fieldsToDBML(tableName, fields, language) {
  let code = `Table ${tableName} {\n`;

  fields.forEach((field) => {
    if (language === 'mongodb' && field.name === '_id') return; // skip _id for mongo

    const opts = [];

    if (language === 'sql') {
      if (field.isPk) opts.push('pk');
      if (field.isIncrement) opts.push('increment');
      if (field.isNotNull) opts.push('notnull');
      if (field.isUnique) opts.push('unique');
      if (field.defaultVal) opts.push(`default: "${field.defaultVal}"`);
      if (field.isIndex) opts.push('index');
    } else {
      // MongoDB
      if (field.isRequired) opts.push('required');
      if (field.isUnique) opts.push('unique');
      if (field.isTrim) opts.push('trim');
      if (field.isLowercase) opts.push('lowercase');
      if (field.isUppercase) opts.push('uppercase');
      if (field.defaultVal) opts.push(`default: "${field.defaultVal}"`);
      if (field.ref) opts.push(`ref: > ${field.ref}`);
      if (field.minLength) opts.push(`minlength: ${field.minLength}`);
      if (field.maxLength) opts.push(`maxlength: ${field.maxLength}`);
      if (field.enumValues) opts.push(`enum: ${field.enumValues}`);
      if (field.isIndex) opts.push('index');
    }

    const type = language === 'mongodb' ? field.type.toLowerCase() : field.type;
    const optStr = opts.length ? ` [${opts.join(', ')}]` : '';
    code += `  ${field.name} ${type}${optStr}\n`;
  });

  code += '}\n';
  return code;
}

const CreateDatabaseModal = ({ open, onClose, selectedProjectId, onCreated }) => {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('sql');

  // Step 2 state
  const [tableName, setTableName] = useState('users');
  const [fields, setFields] = useState([
    createDefaultSQLField(0),
    { ...createDefaultSQLField(1), name: 'email', type: 'varchar', isNotNull: true, isUnique: true },
    { ...createDefaultSQLField(2), name: 'created_at', type: 'timestamp', isNotNull: true },
  ]);

  const [isCreating, setIsCreating] = useState(false);

  // Reset fields when language changes
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (lang === 'sql') {
      setTableName('users');
      setFields([
        createDefaultSQLField(0),
        { ...createDefaultSQLField(1), name: 'email', type: 'varchar', isNotNull: true, isUnique: true },
        { ...createDefaultSQLField(2), name: 'created_at', type: 'timestamp', isNotNull: true },
      ]);
    } else {
      setTableName('users');
      setFields([
        createDefaultMongoField(0),
        { ...createDefaultMongoField(1), name: 'email', type: 'String', isRequired: true, isUnique: true, isTrim: true, isLowercase: true },
        { ...createDefaultMongoField(2), name: 'name', type: 'String', isRequired: true, isTrim: true },
        { ...createDefaultMongoField(3), name: 'createdAt', type: 'Date', defaultVal: 'Date.now' },
      ]);
    }
  };

  const addField = () => {
    if (language === 'sql') {
      setFields((prev) => [...prev, createDefaultSQLField(prev.length)]);
    } else {
      setFields((prev) => [...prev, createDefaultMongoField(prev.length)]);
    }
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index, updates) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (!tableName.trim()) return;

    setIsCreating(true);
    try {
      const code = fieldsToDBML(tableName, fields, language);
      await onCreated({
        name: name.trim(),
        description: description.trim(),
        projectId: selectedProjectId,
        language,
        code,
        nodes: [],
        edges: [],
      });
      // Reset and close
      setStep(1);
      setName('');
      setDescription('');
      setLanguage('sql');
      setTableName('users');
      setFields([createDefaultSQLField(0)]);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsCreating(false);
    }
  };

  const canProceedStep1 = name.trim().length > 0;
  const canCreate = tableName.trim().length > 0 && fields.length > 0;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
          className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-gradient-to-r from-primary/5 via-transparent to-indigo-500/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 border border-primary/20">
                <Database className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-foreground tracking-tight">Create Database Model</h2>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  {step === 1 ? 'Configure your database details' : 'Define your schema fields'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* ── Step Indicator ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border/20 bg-muted/10">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
              step === 1
                ? 'bg-primary/15 text-primary border-primary/25'
                : 'bg-muted/30 text-muted-foreground border-border/30'
            }`}>
              <FileCode className="h-3 w-3" />
              <span>Details</span>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
              step === 2
                ? 'bg-primary/15 text-primary border-primary/25'
                : 'bg-muted/30 text-muted-foreground border-border/30'
            }`}>
              <Layers className="h-3 w-3" />
              <span>Schema</span>
            </div>
          </div>

          {/* ── Step Content ── */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Model Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. E-Commerce Database, Blog Schema..."
                      className="flex h-10 w-full rounded-lg border border-input bg-background/60 px-3.5 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Description <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this database model..."
                      rows={2}
                      className="flex w-full rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Database Language <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* SQL Option */}
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('sql')}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                          language === 'sql'
                            ? 'border-primary bg-primary/8 shadow-lg shadow-primary/10'
                            : 'border-border/40 bg-background/30 hover:border-primary/30 hover:bg-muted/30'
                        }`}
                      >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${
                          language === 'sql'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted/50 text-muted-foreground group-hover:text-primary'
                        }`}>
                          <Table2 className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-bold block ${language === 'sql' ? 'text-primary' : 'text-foreground'}`}>SQL</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">PostgreSQL, MySQL, SQLite</span>
                        </div>
                        {language === 'sql' && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </button>

                      {/* MongoDB Option */}
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('mongodb')}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                          language === 'mongodb'
                            ? 'border-emerald-500 bg-emerald-500/8 shadow-lg shadow-emerald-500/10'
                            : 'border-border/40 bg-background/30 hover:border-emerald-500/30 hover:bg-muted/30'
                        }`}
                      >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${
                          language === 'mongodb'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-muted/50 text-muted-foreground group-hover:text-emerald-500'
                        }`}>
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-bold block ${language === 'mongodb' ? 'text-emerald-500' : 'text-foreground'}`}>MongoDB</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">Mongoose Schemas</span>
                        </div>
                        {language === 'mongodb' && (
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Table / Collection Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {language === 'sql' ? 'Table Name' : 'Collection Name'} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder={language === 'sql' ? 'e.g. users, products, orders...' : 'e.g. users, posts, comments...'}
                      className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Fields Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {language === 'sql' ? 'Columns' : 'Fields'} ({fields.length})
                    </span>
                    <button
                      onClick={addField}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold tracking-wide transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add {language === 'sql' ? 'Column' : 'Field'}</span>
                    </button>
                  </div>

                  {/* Fields List */}
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={index}
                        className="relative p-3.5 rounded-xl border border-border/40 bg-background/40 space-y-3 group hover:border-border/60 transition-all"
                      >
                        {/* Delete button */}
                        {fields.length > 1 && (
                          <button
                            onClick={() => removeField(index)}
                            className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Remove field"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}

                        {/* Row 1: Name + Type */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Name</label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              className="flex h-8 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                              placeholder="field_name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(index, { type: e.target.value })}
                              className="flex h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer transition-all"
                            >
                              {(language === 'sql' ? SQL_TYPES : MONGO_TYPES).map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Constraint Checkboxes */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 select-none">
                          {language === 'sql' ? (
                            <>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isPk || false}
                                  onChange={(e) => updateField(index, { isPk: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <Key className="h-3 w-3 text-amber-500" />
                                <span className="text-[10px] font-bold text-muted-foreground">PK</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isNotNull || false}
                                  onChange={(e) => updateField(index, { isNotNull: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">NOT NULL</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isUnique || false}
                                  onChange={(e) => updateField(index, { isUnique: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">UNIQUE</span>
                              </label>
                              {(field.type === 'integer' || field.type === 'serial' || field.type === 'bigint') && (
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.isIncrement || false}
                                    onChange={(e) => updateField(index, { isIncrement: e.target.checked })}
                                    className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                  />
                                  <Hash className="h-3 w-3 text-indigo-400" />
                                  <span className="text-[10px] font-bold text-muted-foreground">AUTO INC</span>
                                </label>
                              )}
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isIndex || false}
                                  onChange={(e) => updateField(index, { isIndex: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">INDEX</span>
                              </label>
                            </>
                          ) : (
                            <>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isRequired || false}
                                  onChange={(e) => updateField(index, { isRequired: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">REQUIRED</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isUnique || false}
                                  onChange={(e) => updateField(index, { isUnique: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">UNIQUE</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isTrim || false}
                                  onChange={(e) => updateField(index, { isTrim: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">TRIM</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isLowercase || false}
                                  onChange={(e) => updateField(index, { isLowercase: e.target.checked, isUppercase: false })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">LOWERCASE</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isUppercase || false}
                                  onChange={(e) => updateField(index, { isUppercase: e.target.checked, isLowercase: false })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">UPPERCASE</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.isIndex || false}
                                  onChange={(e) => updateField(index, { isIndex: e.target.checked })}
                                  className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer accent-[hsl(var(--primary))]"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">INDEX</span>
                              </label>
                            </>
                          )}
                        </div>

                        {/* Row 3: Extended options */}
                        <div className={`grid gap-2.5 ${language === 'sql' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {/* Default value — both languages */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Default</label>
                            <input
                              type="text"
                              value={field.defaultVal || ''}
                              onChange={(e) => updateField(index, { defaultVal: e.target.value })}
                              className="flex h-7 w-full rounded-md border border-border/50 bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                              placeholder="Default value..."
                            />
                          </div>

                          {/* MongoDB-specific extra fields */}
                          {language === 'mongodb' && field.type === 'ObjectId' && (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Ref (Collection)</label>
                              <input
                                type="text"
                                value={field.ref || ''}
                                onChange={(e) => updateField(index, { ref: e.target.value })}
                                className="flex h-7 w-full rounded-md border border-border/50 bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                placeholder="e.g. Users"
                              />
                            </div>
                          )}

                          {language === 'mongodb' && field.type === 'String' && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Min Length</label>
                                <input
                                  type="number"
                                  value={field.minLength || ''}
                                  onChange={(e) => updateField(index, { minLength: e.target.value })}
                                  className="flex h-7 w-full rounded-md border border-border/50 bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Max Length</label>
                                <input
                                  type="number"
                                  value={field.maxLength || ''}
                                  onChange={(e) => updateField(index, { maxLength: e.target.value })}
                                  className="flex h-7 w-full rounded-md border border-border/50 bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                  placeholder="255"
                                  min="0"
                                />
                              </div>
                            </>
                          )}

                          {language === 'mongodb' && (
                            <div className={`space-y-1 ${field.type === 'String' ? 'col-span-2' : ''}`}>
                              <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Enum Values</label>
                              <input
                                type="text"
                                value={field.enumValues || ''}
                                onChange={(e) => updateField(index, { enumValues: e.target.value })}
                                className="flex h-7 w-full rounded-md border border-border/50 bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                placeholder="val1, val2, val3..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/30 bg-muted/10">
            <div>
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer active:scale-95 transition-all ${
                    canProceedStep1
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <span>Next: Schema</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!canCreate || isCreating}
                  className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-bold cursor-pointer active:scale-95 transition-all ${
                    canCreate && !isCreating
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Create Database</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateDatabaseModal;
