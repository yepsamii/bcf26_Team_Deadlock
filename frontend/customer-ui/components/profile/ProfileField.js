// Profile Field Component
function ProfileField({ label, value }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700 mb-1 sm:mb-0">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
        </div>
    );
}
