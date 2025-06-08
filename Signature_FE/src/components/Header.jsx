import React, { useState, useRef, useEffect } from 'react';

const Header = ({ activePath, onNavigate, onLogout, user }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const mobileMenuRef = useRef(null);
    const userMenuRef = useRef(null);

    // Đóng menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
                !event.target.closest('[aria-label="Open main menu"]')) {
                setShowMobileMenu(false);
            }

            if (userMenuRef.current && !userMenuRef.current.contains(event.target) &&
                !event.target.closest('[aria-label="Open user menu"]')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside); // Cho mobile
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Đóng menu khi nhấn phím Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowMobileMenu(false);
                setShowUserMenu(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left side - Logo and Desktop Navigation */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600 cursor-pointer" onClick={() => onNavigate("/")}>
                                nasSign
                            </span>
                        </div>

                        {/* Desktop Navigation (hidden on mobile) */}
                        <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <button
                                onClick={() => {
                                    onNavigate("/dashboard");
                                    setShowMobileMenu(false);
                                }}
                                className={`${activePath === "/dashboard" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    onNavigate("/documents");
                                    setShowMobileMenu(false);
                                }}
                                className={`${activePath === "/documents" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                            >
                                Tài liệu
                            </button>
                        </nav>
                    </div>

                    {/* Right side - User menu and Mobile button */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200"
                            aria-label="Open main menu"
                            aria-expanded={showMobileMenu}
                        >
                            <span className="sr-only">Open main menu</span>
                            {showMobileMenu ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>

                        {/* Desktop User Menu (hidden on mobile) */}
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="ml-3 relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:ring-2 hover:ring-indigo-300"
                                    aria-label="Open user menu"
                                    aria-expanded={showUserMenu}
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                                        {user?.username?.charAt(0) || 'U'}
                                    </div>
                                </button>

                                {/* User dropdown menu */}
                                {showUserMenu && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                                        <div className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'Người dùng'}</p>
                                            <p className="text-xs text-gray-500 truncate mt-1">{user?.email || ''}</p>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    onNavigate("/profile");
                                                    setShowUserMenu(false);
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors duration-150"
                                            >
                                                Thông tin tài khoản
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setShowUserMenu(false);
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors duration-150"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (shown on small screens) */}
            <div
                ref={mobileMenuRef}
                className={`sm:hidden absolute top-16 inset-x-0 bg-white shadow-lg z-40 transition-all duration-300 ease-in-out ${showMobileMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                aria-hidden={!showMobileMenu}
            >
                <div className="pt-2 pb-3 space-y-1">
                    <button
                        onClick={() => {
                            onNavigate("/dashboard");
                            setShowMobileMenu(false);
                        }}
                        className={`${activePath === "/dashboard" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => {
                            onNavigate("/documents");
                            setShowMobileMenu(false);
                        }}
                        className={`${activePath === "/documents" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                    >
                        Tài liệu
                    </button>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                                {user?.username?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="ml-3">
                            <div className="text-base font-medium text-gray-800">{user?.username || 'Người dùng'}</div>
                            <div className="text-sm font-medium text-gray-500">{user?.email || ''}</div>
                        </div>
                    </div>
                    <div className="mt-3 space-y-1">
                        <button
                            onClick={() => {
                                onNavigate("/profile");
                                setShowMobileMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                        >
                            Thông tin tài khoản
                        </button>
                        <button
                            onClick={() => {
                                onLogout();
                                setShowMobileMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;