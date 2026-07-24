import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const FlowDialog = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags?.join(', ') || '');
    } else {
      setName('');
      setDescription('');
      setTags('');
    }
    setErrors({});
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (name.length > 100) newErrors.name = 'Name cannot exceed 100 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={cn(
          'relative w-full max-w-md rounded-2xl border border-border/40 bg-card shadow-2xl',
          'backdrop-blur-xl p-6'
        )}>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {mode === 'create' ? 'Create Flow' : mode === 'edit' ? 'Edit Flow' : 'Duplicate Flow'}
              </DialogTitle>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {mode === 'create'
                ? 'Create a new automation flow'
                : 'Update the flow details'}
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                placeholder="e.g. Student Registration Flow"
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl border text-sm text-foreground bg-muted/30 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
                  errors.name ? 'border-red-500/50' : 'border-border/40'
                )}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this flow does..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-border/40 text-sm text-foreground bg-muted/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="admin, registration, student"
                className="w-full px-3 py-2.5 rounded-xl border border-border/40 text-sm text-foreground bg-muted/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Separate tags with commas</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border/40 text-sm text-muted-foreground hover:bg-muted/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-all active:scale-[0.98]"
              >
                {mode === 'create' ? 'Create Flow' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlowDialog;
