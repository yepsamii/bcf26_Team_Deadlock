// Auth View Component with Login/Register
function AuthView({ onLogin }) {
    const { useState } = React;

    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validate login form
    const validateLogin = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate register form
    const validateRegister = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle login
    const handleLogin = (e) => {
        e.preventDefault();

        if (!validateLogin()) return;

        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            const users = getRegisteredUsers();
            const user = users.find(
                u => u.email.toLowerCase() === formData.email.toLowerCase() &&
                     u.password === formData.password
            );

            if (user) {
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('valerix_remember', 'true');
                }
                onLogin({ id: user.id, name: user.name, email: user.email });
            } else {
                setErrors({ form: 'Invalid email or password' });
            }
            setIsLoading(false);
        }, 800);
    };

    // Handle register
    const handleRegister = (e) => {
        e.preventDefault();

        if (!validateRegister()) return;

        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            const users = getRegisteredUsers();

            // Check if email already exists
            if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
                setErrors({ email: 'Email already registered' });
                setIsLoading(false);
                return;
            }

            // Create new user
            const newUser = {
                id: users.length + 1,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            users.push(newUser);
            saveRegisteredUsers(users);

            // Auto login after registration
            onLogin({ id: newUser.id, name: newUser.name, email: newUser.email });
            setIsLoading(false);
        }, 800);
    };

    // Switch between login and register
    const switchMode = () => {
        setAuthMode(authMode === 'login' ? 'register' : 'login');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Valerix</h1>
                    <p className="text-gray-600">E-Commerce Platform</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-xl card-shadow-lg p-8 border border-gray-100">
                    {/* Tab Headers */}
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => authMode === 'register' && switchMode()}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                                authMode === 'login'
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Sign In
                            {authMode === 'login' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                            )}
                        </button>
                        <button
                            onClick={() => authMode === 'login' && switchMode()}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                                authMode === 'register'
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Sign Up
                            {authMode === 'register' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {errors.form && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {errors.form}
                        </div>
                    )}

                    {/* Forms */}
                    {authMode === 'login' ? (
                        <LoginForm
                            formData={formData}
                            errors={errors}
                            showPassword={showPassword}
                            rememberMe={rememberMe}
                            isLoading={isLoading}
                            handleChange={handleChange}
                            setShowPassword={setShowPassword}
                            setRememberMe={setRememberMe}
                            handleSubmit={handleLogin}
                        />
                    ) : (
                        <RegisterForm
                            formData={formData}
                            errors={errors}
                            showPassword={showPassword}
                            showConfirmPassword={showConfirmPassword}
                            isLoading={isLoading}
                            handleChange={handleChange}
                            setShowPassword={setShowPassword}
                            setShowConfirmPassword={setShowConfirmPassword}
                            handleSubmit={handleRegister}
                        />
                    )}
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-medium text-blue-900 mb-2">Demo Credentials:</p>
                    <p className="text-xs text-blue-700">Email: demo@valerix.com</p>
                    <p className="text-xs text-blue-700">Password: demo</p>
                </div>
            </div>
        </div>
    );
}
