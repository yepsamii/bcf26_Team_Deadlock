// Mobile Navigation Tab Component
function MobileNavTab({ active, onClick, icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 border-b-2 border-transparent'
            }`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
}
