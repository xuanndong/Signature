import { useState } from "react";
import FilePreviewModal from "./FilePreviewModal";
import SignatureInterface from "./SignatureInterface";
import VerificationInterface from "./VerificationInterface";
import { documentContent } from "../api";

// SVG Icons
const DownloadIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const LockClosedIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FileList = ({ documents, loading, signingFile, setSigningFile, verificationFile, setVerificationFile, user }) => {
    const [previewFile, setPreviewFile] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [signingFileData, setSigningFileData] = useState(null);
    const [verificationFileData, setVerificationFileData] = useState(null);

    const handleViewFile = async (document) => {
        try {
            setPreviewLoading(true);
            const responseData = await documentContent(document.id);

            const byteString = atob(responseData.content);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([byteArray], { type: responseData.mime_type || 'application/pdf' });
            const fileUrl = URL.createObjectURL(blob);

            setPreviewFile({
                name: responseData.filename || document.name,
                url: fileUrl,
                type: responseData.mime_type || 'application/pdf',
                rawData: byteArray
            });

        } catch (error) {
            console.error("Failed to load file:", error);
            alert(error.message || "Không thể tải nội dung file");
            setPreviewFile(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSignFile = async (document) => {
        try {
            setPreviewLoading(true);
            const responseData = await documentContent(document.id);

            const byteString = atob(responseData.content);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([byteArray], { type: responseData.mime_type || 'application/pdf' });
            const file = new File([blob], responseData.filename || document.name, {
                type: responseData.mime_type || 'application/pdf'
            });

            setSigningFile(file);
            setSigningFileData({
                name: responseData.filename || document.name,
                rawData: byteArray
            });
            setPreviewFile(null); // Ẩn preview nếu đang mở

        } catch (error) {
            console.error("Failed to load file for signing:", error);
            alert(error.message || "Không thể tải file để ký số");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleBackFromSigning = () => {
        setSigningFile(null);
        setSigningFileData(null);
    };


    const handleVerifyFile = async (document) => {
        try {
            setPreviewLoading(true);
            const responseData = await documentContent(document.id);

            const byteString = atob(responseData.content);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([byteArray], { type: responseData.mime_type || 'application/pdf' });
            const file = new File([blob], responseData.filename || document.name, {
                type: responseData.mime_type || 'application/pdf'
            });

            setVerificationFile(file);
            setVerificationFileData({
                name: responseData.filename || document.name,
                rawData: byteArray
            });
            setPreviewFile(null);

        } catch (error) {
            console.error("Failed to load file for verification:", error);
            alert(error.message || "Không thể tải file để xác thực");
        } finally {
            setPreviewLoading(false);
        }
    };


    const handleBackFromVerification = () => {
        setVerificationFile(null);
        setVerificationFileData(null);
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Nếu đang trong chế độ ký số, chỉ hiển thị SignatureInterface
    if (signingFile) {
        return (
            <SignatureInterface
                file={signingFile} // dang xu ly voi signing file va tai chu ky 
                onBack={handleBackFromSigning}
                originalFileData={signingFileData}
                user={user}
            />
        );
    }

    if (verificationFile) {
        return (
            <VerificationInterface
                file={verificationFile}
                onBack={handleBackFromVerification}
                originalFileData={verificationFileData}
            />
        );
    }

    return (
        <>
            {/* Modal xem trước file */}
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    onClose={() => {
                        URL.revokeObjectURL(previewFile.url);
                        setPreviewFile(null);
                    }}
                    isLoading={previewLoading}
                />
            )}

            {/* Bảng danh sách file */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-400">
                            <tr>
                                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Tên văn bản</th>
                                <th className="px-3 py-2 sm:px-5 sm:py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Định dạng</th>
                                <th className="px-3 py-2 sm:px-5 sm:py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Thời gian</th>
                                <th className="px-3 py-2 sm:px-5 sm:py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Trạng thái</th>
                                <th className="px-3 py-2 sm:px-5 sm:py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 sm:px-6 sm:py-4 max-w-xs sm:max-w-50 truncate text-sm font-medium text-gray-900" title={doc.name}>
                                        {doc.name}
                                    </td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.format}
                                    </td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.date}
                                    </td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${doc.status === 'Đã ký' ? 'bg-green-100 text-green-800' :
                                            doc.status === 'Đã xác thực' ? 'bg-blue-100 text-blue-800' :
                                                doc.status === 'Xác thực thất bại' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleViewFile(doc)}
                                                className="cursor-pointer flex items-center justify-center px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                <EyeIcon /> Xem
                                            </button>
                                            <button
                                                onClick={() => handleSignFile(doc)}
                                                className="cursor-pointer flex items-center justify-center px-2 py-1 border border-transparent rounded text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <LockClosedIcon /> Ký số
                                            </button>
                                            <button
                                                onClick={() => handleVerifyFile(doc)}
                                                className="cursor-pointer flex items-center justify-center px-2 py-1 border border-transparent rounded text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircleIcon /> Xác thực
                                            </button>
                                            <button
                                                onClick={() => alert(`Tải xuống: ${doc.name}`)}
                                                className="cursor-pointer flex items-center justify-center px-2 py-1 border border-transparent rounded text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                <DownloadIcon /> Tải xuống
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default FileList;