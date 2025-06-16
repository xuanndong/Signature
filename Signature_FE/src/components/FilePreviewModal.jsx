
const FilePreviewModal = ({ file, onClose, isLoading }) => {

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-gray-200 p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800">Xem trước: {file.name}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Đóng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow p-4 sm:p-4 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-3">Đang tải tài liệu...</span>
                        </div>
                    ) : (
                        <div className="h-full w-full">
                            {file.url ? (
                                <iframe
                                    src={file.url}
                                    width="100%"
                                    height="100%"
                                    className="min-h-[70vh] border-0"
                                    title={`PDF Viewer - ${file.name}`}
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Không có nội dung để hiển thị
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal