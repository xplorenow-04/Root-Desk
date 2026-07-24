import { ROLES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

const FlowPermissions = ({ permissions = { allowedRoles: ['admin'] }, onChange }) => {
  const roles = permissions.allowedRoles || [];

  const toggleRole = (role) => {
    const updated = roles.includes(role)
      ? roles.filter(r => r !== role)
      : [...roles, role];
    onChange({ ...permissions, allowedRoles: updated });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Allowed Roles</p>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role.value}
            onClick={() => toggleRole(role.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              roles.includes(role.value)
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-muted-foreground/30'
            )}
          >
            {role.label}
          </button>
        ))}
      </div>
      {roles.length === 0 && (
        <p className="text-[10px] text-red-400">Select at least one role to allow execution</p>
      )}
    </div>
  );
};

export default FlowPermissions;
