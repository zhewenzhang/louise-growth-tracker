import React from 'react';

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-white/85 font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-white/50 text-sm mb-6 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-rose text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-rose-deep transition-colors active:scale-[0.97]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
