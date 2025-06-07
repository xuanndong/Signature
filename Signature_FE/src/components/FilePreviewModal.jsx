import { useState, useEffect } from 'react';

const FilePreviewModal = ({ file, fileData, onClose }) => {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        if (!file || !fileData) return;

        const processFileContent = async () => {
            setIsLoading(true);
            try {
                if (file.type.startsWith('image/')) {
                    // Hiển thị ảnh
                    const base64 = arrayBufferToBase64(fileData);
                    setContent(
                        <img
                            src={`data:${file.type};base64,${base64}`}
                            alt={file.name}
                            className="max-w-full max-h-[70vh] object-contain mx-auto"
                        />
                    );
                } else if (file.type === 'application/pdf') {
                    // Tạo URL cho PDF để dùng với iframe
                    const blob = new Blob([fileData], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setFileUrl(url);

                    setContent(
                        <iframe
                            src={url}
                            width="100%"
                            height="500px"
                            className="border-0"
                            title="PDF Viewer"
                        />
                    );
                } else if (file.type.startsWith('text/') ||
                    ['.txt', '.csv', '.json'].some(ext => file.name.endsWith(ext))) {
                    // File văn bản
                    const text = new TextDecoder().decode(fileData);
                    setContent(
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[70vh] text-sm whitespace-pre-wrap">
                            {text}
                        </pre>
                    );
                } else {
                    // File không hỗ trợ
                    setContent(
                        <div className="text-center py-8">
                            <p className="text-gray-600">
                                Không hỗ trợ xem trước cho loại file này.
                            </p>
                        </div>
                    );
                }
            } catch (error) {
                console.error("Lỗi xử lý file:", error);
                setContent(
                    <div className="text-center py-8">
                        <p className="text-red-500">Đã xảy ra lỗi khi tải file.</p>
                    </div>
                );
            } finally {
                setIsLoading(false);
            }
        };

        processFileContent();

        return () => {
            // Cleanup khi component unmount
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [file, fileData]);

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-gray-200 p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800">Xem trước tài liệu</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow p-4 sm:p-6 overflow-auto">
                    <div className="text-center mb-4">
                        <p className="text-gray-600 truncate text-sm sm:text-base">
                            <span className="font-medium">Đang xem:</span> {file.name}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 min-h-[200px] flex items-center justify-center">
                            {content || (
                                <div className="text-gray-500">
                                    Không có nội dung để hiển thị
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 p-4 sm:p-6 flex justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;