import { useState } from 'react';
import { uploadDocument } from '../api';

const UploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            await uploadDocument(file);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Upload thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Tải lên tài liệu</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn file PDF
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className={`px-4 py-2 rounded-md text-white ${
                                !file || loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {loading ? 'Đang tải lên...' : 'Tải lên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;