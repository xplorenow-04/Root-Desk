import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Copy, Check, Play, ShieldAlert, Award, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { generateSQL } from '../generators/sqlGenerator';
import { generateORM } from '../generators/ormGenerator';
import { validateSchema } from '../validation/schemaValidator';

const Console = ({ tables = [], relationships = [], isCollapsed = false, onToggleCollapse }) => {
  const [activeTab, setActiveTab] = useState('sql');
  const [sqlDialect, setSqlDialect] = useState('postgresql');
  const [ormType, setOrmType] = useState('prisma');
  const [copied, setCopied] = useState(false);

  // Generate output based on tab and settings
  const generatedCode = useMemo(() => {
    if (activeTab === 'sql') {
      return generateSQL(tables, relationships, sqlDialect);
    } else if (activeTab === 'orm') {
      return generateORM(tables, relationships, ormType);
    }
    return '';
  }, [tables, relationships, activeTab, sqlDialect, ormType]);

  // Validation diagnostics
  const diagnostics = useMemo(() => {
    return validateSchema(tables, relationships);
  }, [tables, relationships]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500 border-emerald-500/35';
    if (score >= 70) return 'text-amber-500 border-amber-500/35';
    return 'text-destructive border-destructive/35';
  };

  return (
    <motion.div
      animate={{ height: isCollapsed ? 40 : 192 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col bg-card border-t border-border/40 text-foreground w-full shrink-0 overflow-hidden"
    >
      {/* Console Tab headers */}
      <div className="flex items-center justify-between border-b border-border/20 px-4 h-10 select-none bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'sql' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SQL Console
          </button>
          <button
            onClick={() => setActiveTab('orm')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'orm' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ORM Models
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'diagnostics' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Diagnostics</span>
            {diagnostics.issues.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9.5px] font-black text-white">
                {diagnostics.issues.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Dialect / Format configuration */}
          <div className="flex items-center gap-3">
            {activeTab === 'sql' && (
              <select
                value={sqlDialect}
                onChange={(e) => setSqlDialect(e.target.value)}
                className="flex h-7 rounded border border-border/60 bg-background px-2 text-[10px] font-bold uppercase focus:outline-none cursor-pointer"
              >
                <option value="postgresql">Postgres</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="sqlserver">SQL Server</option>
                <option value="oracle">Oracle</option>
              </select>
            )}

            {activeTab === 'orm' && (
              <select
                value={ormType}
                onChange={(e) => setOrmType(e.target.value)}
                className="flex h-7 rounded border border-border/60 bg-background px-2 text-[10px] font-bold uppercase focus:outline-none cursor-pointer"
              >
                <option value="prisma">Prisma</option>
                <option value="mongoose">Mongoose</option>
                <option value="drizzle">Drizzle</option>
                <option value="sequelize">Sequelize</option>
                <option value="typeorm">TypeORM</option>
              </select>
            )}

            {activeTab !== 'diagnostics' && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold border border-border/60 rounded bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title={isCollapsed ? 'Expand console' : 'Collapse console'}
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Console Tab Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-background/40 scrollbar-thin">
          {activeTab === 'diagnostics' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Ring */}
              <div className="flex flex-col items-center justify-center p-4 border border-border/40 rounded-xl bg-card/25 shadow-inner">
                <Award className="h-6 w-6 text-indigo-400 mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Normalization Score</span>
                <span className={`text-4xl font-extrabold mt-1.5 ${getScoreColor(diagnostics.stats.normalizationScore)}`}>
                  {diagnostics.stats.normalizationScore}%
                </span>
                <span className="text-[9.5px] text-muted-foreground/60 mt-1 select-none">
                  Score based on relational best practices
                </span>
              </div>

              {/* Diagnostic Logs (Errors & Warnings) */}
              <div className="md:col-span-2 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block select-none">
                    Diagnostic issues ({diagnostics.issues.length})
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {diagnostics.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] leading-relaxed ${
                          issue.type === 'error'
                            ? 'bg-destructive/10 border-destructive/25 text-destructive'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                        }`}
                      >
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{issue.message}</span>
                      </div>
                    ))}
                    {!diagnostics.issues.length && (
                      <div className="text-emerald-500 flex items-center gap-1.5 py-1.5 italic">
                        <Check className="h-4 w-4" />
                        <span>Zero database modeling issues detected!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                {diagnostics.suggestions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block select-none">
                      Performance & Naming Optimization Suggestions
                    </span>
                    <div className="space-y-1 px-1 max-h-[100px] overflow-y-auto">
                      {diagnostics.suggestions.map((sug, idx) => (
                        <div key={idx} className="text-foreground/80 flex items-center gap-1.5 text-[11px]">
                          <span className="text-primary font-bold">•</span>
                          <span>{sug.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed text-foreground/85 select-text selection:bg-primary/25">
              {generatedCode}
            </pre>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Console;
