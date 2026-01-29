// Quick Action Card Component
function QuickActionCard({ title, description, icon }) {
    return (
        <button className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </button>
    );
}
