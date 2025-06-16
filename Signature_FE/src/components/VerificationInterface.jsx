import { useState, useEffect } from 'react';
import { verifyPDF, getPublicCert, getUserProfile } from '../api';
import Notification from './Notification';

const VerificationInterface = ({ file, onBack, handleUploadSuccess }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [certificateInfo, setCertificateInfo] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [isLoadingCert, setIsLoadingCert] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });
    };

    const handleVerify = async () => {
        if (!file) {
            showNotification('error', 'Vui lòng chọn file PDF trước khi xác thực');
            return;
        }

        if (!certificateInfo) {
            showNotification('error', 'Vui lòng chọn hoặc lấy chứng thư số trước khi xác thực');
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            const result = await verifyPDF(file, certificateInfo);

            const verificationData = {
                success: result.success,
                isValid: result.isValid,
                message: result.message,
                details: result.details
            };

            setVerificationResult(verificationData);

            if (result.success && result.isValid) {
                showNotification('success', 'Xác thực thành công!');
            } else {
                showNotification('error', result.message || 'Xác thực không thành công');
            }

        } catch (error) {
            console.error("Lỗi xác thực:", error);
            const errorMessage = error.message || 'Đã xảy ra lỗi trong quá trình xác thực';
            showNotification('error', errorMessage);

            const errorResult = {
                success: false,
                isValid: false,
                message: errorMessage,
                details: null
            };
            setVerificationResult(errorResult);

        } finally {
            setIsVerifying(false);
        }
    };

    const handleCertificateImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsLoadingCert(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                setCertificateInfo(content);
                setCertificateFile({
                    name: file.name,
                    type: file.type
                });
                setVerificationResult(null);
                setIsLoadingCert(false);
            };
            reader.onerror = () => {
                showNotification('error', 'Lỗi khi đọc file chứng thư');
                setIsLoadingCert(false);
            };
            reader.readAsText(file);
        }
    };

    const handleGetCertificate = async () => {
        try {
            setIsLoadingCert(true);
            const user = await getUserProfile();
            const publicKey = await getPublicCert();

            if (publicKey) {
                const userCert = {
                    name: `ChungThuSo_${user.username}.cer`,
                    type: "application/x-x509-ca-cert"
                };

                setCertificateInfo(publicKey);
                setCertificateFile(userCert);
                setVerificationResult(null);
            } else {
                throw new Error('Không thể lấy chứng thư số từ hệ thống');
            }
        } catch (error) {
            console.error("Lỗi khi lấy chứng thư số:", error);
            showNotification('error', error.message);
        } finally {
            setIsLoadingCert(false);
        }
    };


    return (
        <div className="transition-opacity duration-300 ease-in-out max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-md">
            {/* Notification */}
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                    onBack={onBack}
                    handleUploadSuccess={handleUploadSuccess}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Xác thực văn bản</h2>
                <button
                    onClick={onBack}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label="Đóng"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <DocumentIcon className="h-10 w-10 text-blue-500 mr-4" />
                    <div>
                        <h3 className="font-medium text-gray-800 truncate max-w-xs">{file.name}</h3>
                        <p className="text-sm text-gray-500">{file.type}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h3 className="font-medium text-gray-700 mb-3">Thông tin xác thực</h3>

                    {certificateFile ? (
                        <div className="mb-4">
                            <div className="flex items-center mb-2">
                                <CertificateIcon className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-sm font-medium">{certificateFile.name}</span>
                                {isLoadingCert && (
                                    <SpinnerIcon className="animate-spin h-4 w-4 text-gray-500 ml-2" />
                                )}
                            </div>
                            {!isLoadingCert && (
                                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded overflow-x-auto">
                                    {certificateInfo && certificateInfo.length > 100
                                        ? `${certificateInfo.substring(0, 100)}...`
                                        : certificateInfo}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 mb-4">
                            Quá trình xác thực sẽ kiểm tra tính toàn vẹn của văn bản và chữ ký số dựa trên chứng thư số được cung cấp.
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 cursor-pointer">
                            <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-sm font-medium">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".cer,.pem,.crt"
                                    onChange={handleCertificateImport}
                                />
                                Nhập chứng thư số
                            </div>
                        </label>

                        <button
                            onClick={handleGetCertificate}
                            disabled={isLoadingCert}
                            className={`flex-1 px-4 py-2 border rounded-lg text-sm font-medium flex items-center justify-center ${isLoadingCert
                                ? 'bg-gray-100 text-gray-500 border-gray-300'
                                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                }`}
                        >
                            {isLoadingCert ? (
                                <>
                                    <SpinnerIcon className="animate-spin h-4 w-4 mr-2" />
                                    Đang lấy...
                                </>
                            ) : (
                                'Lấy từ hệ thống'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Kết quả xác thực */}
            {verificationResult ? (
                <div className={`p-4 rounded-lg mb-6 ${verificationResult.success && verificationResult.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className="flex items-start">
                        {verificationResult.success && verificationResult.isValid ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium text-gray-800">{verificationResult.message}</p>
                            {verificationResult.details?.verificationTime && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Thời gian xác thực: {new Date(verificationResult.details.verificationTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex flex-col items-center justify-center p-8 rounded-lg mb-6 ${isVerifying
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-dashed border-gray-300'}`}>
                    {isVerifying ? (
                        <>
                            <SpinnerIcon className="animate-spin h-8 w-8 text-blue-500 mb-3" />
                            <p className="text-gray-700">Đang xác thực văn bản...</p>
                        </>
                    ) : (
                        <>
                            <VerifyIcon className="h-8 w-8 text-gray-400 mb-3" />
                            <p className="text-gray-600 text-center">
                                Nhấn "Xác thực" để kiểm tra tính hợp lệ của văn bản
                            </p>
                        </>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Quay lại
                </button>
                <button
                    onClick={handleVerify}
                    disabled={isVerifying || !certificateInfo}
                    className={`px-6 py-2 rounded-lg transition-colors flex items-center justify-center ${isVerifying || !certificateInfo
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isVerifying && (
                        <SpinnerIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                    Xác thực
                </button>
            </div>
        </div>
    );
};

// Icon components
const DocumentIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CertificateIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const VerifyIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const CheckCircleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ExclamationCircleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SpinnerIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default VerificationInterface;