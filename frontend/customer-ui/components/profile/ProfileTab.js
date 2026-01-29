// Profile Tab Component
function ProfileTab({ user }) {
    return (
        <div className="max-w-3xl">
            <div className="bg-white rounded-xl card-shadow overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary-600">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                            <p className="text-primary-100">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                        <div className="space-y-4">
                            <ProfileField label="Full Name" value={user?.name} />
                            <ProfileField label="Email Address" value={user?.email} />
                            <ProfileField label="Account ID" value={`#${user?.id.toString().padStart(6, '0')}`} />
                            <ProfileField label="Member Since" value={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
