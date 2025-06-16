import React, { useState, useEffect } from 'react';

const Profile = ({ user, getPublicCert, getPrivateCert, onUpdate }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [publicKey, setPublicKey] = useState('');
    const [showPublicKey, setShowPublicKey] = useState(false);

    const [privateKey, setPrivateKey] = useState('');
    const [showPrivateKey, setShowPrivateKey] = useState(false);


    useEffect(() => {
        const fetchPublicKey = async () => {
            try {
                const key = await getPublicCert();
                setPublicKey(key);
            } catch (error) {
                console.error('Error fetching public key:', error);
                setMessage({ type: 'error', text: 'Không thể tải khóa công khai' });
            }
        };

        const fetchPrivateKey = async () => {
            try {
                const key = await getPrivateCert();
                setPrivateKey(key);
            } catch (error) {
                console.error('Error fetching private key:', error);
                setMessage({ type: 'error', text: 'Không thể tải khóa bí mật' });
            }
        }

        fetchPublicKey();
        fetchPrivateKey();

    }, [getPublicCert]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await onUpdate(formData);
            if (result.success) {
                setMessage({ type: 'success', text: 'Cập nhật thành công!' });
                setEditMode(false);
            } else {
                setMessage({ type: 'error', text: result.message || 'Cập nhật thất bại' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi cập nhật' });
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPublicKey = () => {
        if (!publicKey) return;

        const element = document.createElement("a");
        const file = new Blob([publicKey], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `public_key_${user?.username || 'user'}.cer`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const togglePublicKeyVisibility = () => {
        setShowPublicKey(!showPublicKey);
    };

    const downloadPrivateKey = () => {
        if (!privateKey) return;

        const element = document.createElement("a");
        const file = new Blob([privateKey], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `private_key_${user?.username || 'user'}.cer`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const togglePrivateKeyVisibility = () => {
        setShowPrivateKey(!showPrivateKey);
    };


    // SVG Icons
    const EyeIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    const DownloadIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    );

    const EditIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    );

    const UserIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );

    const EmailIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
    );

    const KeyIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
        </svg>
    );

    return (
        <div className="bg-gray-100 flex items-start justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white">
                    <h1 className="text-xl font-bold">Thông tin tài khoản</h1>
                </div>

                {/* Content */}
                <div className="p-6">
                    {message.text && (
                        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {!editMode ? (
                        <>
                            {/* View Mode */}
                            <div className="mb-6">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <UserIcon className="mr-2" />
                                    <span className="pl-3 font-medium">Họ và tên</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <span className="font-semibold">{user?.username || 'Chưa cập nhật'}</span>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                        aria-label="Chỉnh sửa"
                                    >
                                        <EditIcon />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <EmailIcon className="mr-2" />
                                    <span className="pl-3 font-medium">Email</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <span className="font-semibold">{user?.email || 'Chưa cập nhật'}</span>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                        aria-label="Chỉnh sửa"
                                    >
                                        <EditIcon />
                                    </button>
                                </div>
                            </div>

                            {/* Private Key Section */}
                            <div className="mb-6">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <KeyIcon className="mr-2" />
                                    <span className="pl-3 font-medium">Khóa công khai (Public Key)</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    {publicKey ? (
                                        <>
                                            <div className="relative">
                                                <textarea
                                                    className="w-full p-2 bg-gray-100 rounded font-mono text-sm mb-2 pr-18"
                                                    rows="4"
                                                    readOnly
                                                    value={showPublicKey ? publicKey : '*'.repeat(40)}
                                                    placeholder="Khóa công khai"
                                                />
                                                <div className="absolute top-2 right-2 flex space-x-2">
                                                    <button
                                                        onClick={togglePublicKeyVisibility}
                                                        className="text-gray-500 hover:text-blue-700"
                                                        title={showPublicKey ? 'Ẩn khóa' : 'Hiện khóa'}
                                                    >
                                                        {showPublicKey ? <EyeOffIcon /> : <EyeIcon />}
                                                    </button>
                                                    <button
                                                        onClick={downloadPublicKey}
                                                        className="text-gray-500 hover:text-blue-700"
                                                        title="Tải về khóa công khai"
                                                    >
                                                        <DownloadIcon />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Khóa này được dùng để xác thực chữ ký số của bạn
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-500 italic">
                                            {isLoading ? 'Đang tải khóa công khai...' : 'Chưa có khóa công khai'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Public Key Section */}
                            <div className="mb-6">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <KeyIcon className="mr-2" />
                                    <span className="pl-3 font-medium">Khóa bí mật (Private Key)</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    {privateKey ? (
                                        <>
                                            <div className="relative">
                                                <textarea
                                                    className="w-full p-2 bg-gray-100 rounded font-mono text-sm mb-2 pr-18"
                                                    rows="4"
                                                    readOnly
                                                    value={showPrivateKey ? privateKey : '*'.repeat(40)}
                                                    placeholder="Khóa bí mật"
                                                />
                                                <div className="absolute top-2 right-2 flex space-x-2">
                                                    <button
                                                        onClick={togglePrivateKeyVisibility}
                                                        className="text-gray-500 hover:text-blue-700"
                                                        title={showPrivateKey ? 'Ẩn khóa' : 'Hiện khóa'}
                                                    >
                                                        {showPrivateKey ? <EyeOffIcon /> : <EyeIcon />}
                                                    </button>
                                                    <button
                                                        onClick={downloadPrivateKey}
                                                        className="text-gray-500 hover:text-blue-700"
                                                        title="Tải về bí mật"
                                                    >
                                                        <DownloadIcon />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Khóa này được dùng để ký số  cho văn bản của bạn
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-500 italic">
                                            {isLoading ? 'Đang tải khóa công khai...' : 'Chưa có khóa công khai'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Edit Mode */}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label className="block text-gray-600 mb-2 font-medium" htmlFor="username">
                                        Họ và tên
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-600 mb-2 font-medium" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditMode(false);
                                            setFormData({
                                                username: user?.username || '',
                                                email: user?.email || ''
                                            });
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                        disabled={isLoading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;