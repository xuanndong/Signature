import React from 'react';

const Profile = ({ user, onNavigate }) => {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Thông tin tài khoản</h2>
                </div>
                <div className="px-6 py-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <p className="text-gray-900">{user?.name || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{user?.email || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => onNavigate("/dashboard")}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;