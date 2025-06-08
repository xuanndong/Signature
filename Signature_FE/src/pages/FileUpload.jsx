import { useState, useRef, useCallback } from 'react';
import Notification from './../components/Notification';
import FilePreviewModal from "./../components/FilePreviewModal";
import SignatureInterface from "./../components/SignatureInterface";
import VerificationInterface from '../components/VerificationInterface';

import { getPublicCert, getUserProfile } from '../api';

const FileUpload = ({ setSelectedFile, user }) => {
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [showVerification, setShowVerification] = useState(false); // Thêm state mới
    const fileInputRef = useRef(null);

    const validateFile = useCallback((file) => {
        if (!file) return false;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setNotification({
                type: 'error',
                message: 'File vượt quá dung lượng cho phép (5MB)'
            });
            return false;
        }

        // Validate file extension
        const validExtensions = ['.doc', '.docx', '.rtf', '.txt', '.cdt', '.pdf'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExt)) {
            setNotification({
                type: 'error',
                message: 'Chỉ chấp nhận file: doc, docx, rtf, txt, cdt và pdf'
            });
            return false;
        }

        return true;
    }, []);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (validateFile(selectedFile)) {
            try {
                const data = await readFileAsArrayBuffer(selectedFile);
                setFile(selectedFile);
                setFileData(data);
                setSelectedFile(selectedFile);
                setNotification({
                    type: 'success',
                    message: 'File đã được chọn thành công'
                });
            } catch (error) {
                setNotification({
                    type: 'error',
                    message: 'Lỗi khi đọc file'
                });
            }
        }
    };

    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (validateFile(droppedFile)) {
            try {
                const data = await readFileAsArrayBuffer(droppedFile);
                setFile(droppedFile);
                setFileData(data);
                setSelectedFile(droppedFile);
            } catch (error) {
                setNotification({
                    type: 'error',
                    message: 'Lỗi khi đọc file'
                });
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const removeFile = () => {
        setFile(null);
        setFileData(null);
        setSelectedFile(null);
        fileInputRef.current.value = '';
        setNotification(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
    };

    const handleSign = () => {
        setShowSignature(true);
    };

    if (showSignature) {
        return (
            <SignatureInterface
                file={file}
                onBack={() => setShowSignature(false)}
                onComplete={(signedFile) => {
                    setFile(signedFile);
                    setShowSignature(false);
                    setNotification({
                        type: 'success',
                        message: 'Văn bản đã được ký số thành công'
                    });
                }}
            />
        );
    }

    const handleVerify = () => {
        setShowVerification(true);
    };

    if (showVerification) {
        return (
            <VerificationInterface
                file={file}
                fileData={fileData}
                onBack={() => setShowVerification(false)}
                onVerifyComplete={(result) => {
                    setShowVerification(false);
                    setNotification({
                        type: result.success ? 'success' : 'error',
                        message: result.message
                    });
                }}
                getPublicCert={getPublicCert}
                getUserProfile={getUserProfile}
            />
        );
    }


    return (
        <div className="max-w-4xl mx-auto p-2 md:p-3">
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header section */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white">
                    <h1 className="text-2xl font-bold text-center">Tải lên văn bản</h1>
                    <p className="text-center text-blue-100 mt-2">
                        Tải lên tài liệu cần ký số hoặc xác thực
                    </p>
                </div>

                {/* Main content */}
                <div className="p-4 md:p-6">
                    {/* Drop zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all mb-6 ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <div className="flex flex-col items-center justify-center">
                            {file ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 text-green-500 mb-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            ) : (
                                <UploadIcon className="h-12 w-12 text-blue-500 mb-4" />
                            )}

                            <h2 className="text-lg font-semibold text-gray-700 mb-2">
                                {file ? 'File đã sẵn sàng' : 'Kéo thả file vào đây hoặc nhấn để chọn file'}
                            </h2>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".doc,.docx,.rtf,.txt,.cdt,.pdf"
                                className="hidden"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Chấp nhận: DOC, DOCX, RTF, TXT, CDT, PDF (tối đa 5MB)
                            </p>
                        </div>
                    </div>

                    {file && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    <DocumentIcon className="h-10 w-10 text-blue-500 mr-4" />
                                    <div>
                                        <h3 className="font-medium text-gray-800 truncate max-w-xs">{file.name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                            <span>Kích thước: {formatFileSize(file.size)}</span>
                                            <span>Loại file: {file.name.split('.').pop().toUpperCase()}</span>
                                            <span>Ngày tải lên: {new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full cursor-pointer hover:bg-red-50 transition-colors"
                                    aria-label="Remove file"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <WarningNote />

                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={!file}
                            className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors ${file
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <EyeIcon className="h-5 w-5 mr-2" />
                            Xem trước
                        </button>
                        <div className="flex gap-3">
                            <button
                                disabled={!file}
                                onClick={handleVerify} 
                                className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors ${file
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <VerifyIcon className="h-5 w-5 mr-2" />
                                Xác thực
                            </button>
                            <button
                                disabled={!file}
                                onClick={handleSign}
                                className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors ${file
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <SignatureIcon className="h-5 w-5 mr-2" />
                                Ký số
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {file && showPreview && (
                <FilePreviewModal
                    file={file}
                    fileData={fileData}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};



export default FileUpload;
// Icons components
const UploadIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
    </svg>
);

const DocumentIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
    </svg>
);

const TrashIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

const WarningNote = () => (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex">
            <ExclamationIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-700">Lưu ý quan trọng</h3>
                <div className="mt-2 text-sm text-yellow-700">
                    <p>Có thể bị lỗi trong quá trình upload file hoặc khi file không phải định dạng được hỗ trợ.</p>
                </div>
            </div>
        </div>
    </div>
);

const ExclamationIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        {...props}
    >
        <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
        />
    </svg>
);

const EyeIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const VerifyIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const SignatureIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

