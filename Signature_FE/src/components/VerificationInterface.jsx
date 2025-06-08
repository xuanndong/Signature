import { useState } from 'react';

const VerificationInterface = ({ file, fileData, onBack, onVerifyComplete, getPublicCert, getUserProfile }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [certificateInfo, setCertificateInfo] = useState(null);

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            // Giả lập quá trình xác thực
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Kết quả giả lập (thay bằng logic thực tế của bạn)
            const randomSuccess = Math.random() > 0.3;
            const result = {
                success: randomSuccess,
                message: randomSuccess
                    ? 'Văn bản đã được xác thực thành công'
                    : 'Không thể xác thực văn bản. Chữ ký không hợp lệ hoặc file đã bị thay đổi.'
            };

            setVerificationResult(result);
            onVerifyComplete(result);
        } catch (error) {
            console.error("Lỗi xác thực:", error);
            const result = {
                success: false,
                message: 'Đã xảy ra lỗi trong quá trình xác thực'
            };
            setVerificationResult(result);
            onVerifyComplete(result);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCertificateImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCertificate(file);
            // Đọc thông tin chứng thư số

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                setCertificateInfo( content.content )
            }
            reader.readAsText(file);
            
        }
    };

    const handleGetCertificate = async () => {
        const user = await getUserProfile();
        const publicKey = await getPublicCert();
        // Lấy chứng thư số từ hệ thống
        const userCert = {
            name: `ChungThuSo_${user.username}.cer`,
            type: "application/x-x509-ca-cert"
        };
        
        setCertificate(userCert);
        setCertificateInfo(publicKey); // lưu public key vào đây
        alert(`Đã lấy chứng thư số: ${userCert.name}`);
        console.log(certificateInfo)
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Xác thực văn bản</h2>
                <button
                    onClick={onBack}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
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
                        <h3 className="font-medium text-gray-800">{file.name}</h3>
                        <p className="text-sm text-gray-500">{file.type}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Thông tin xác thực</h3>

                    {certificate ? (
                        <div className="mb-3">
                            <div className="flex items-center mb-2">
                                <CertificateIcon className="h-6 w-6 text-green-500 mr-2" />
                                <span className="text-sm font-medium">{certificate.name}</span>
                            </div>

                            {/* {certificateInfo && (
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium">Nhà cung cấp:</span> {certificateInfo.issuer}</p>
                                    <p><span className="font-medium">Chủ thể:</span> {certificateInfo.subject}</p>
                                    <p><span className="font-medium">Hiệu lực từ:</span> {certificateInfo.validFrom} đến {certificateInfo.validTo}</p>
                                </div>
                            )} */}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 mb-6">
                            Quá trình xác thực sẽ kiểm tra tính toàn vẹn của văn bản và chữ ký số dựa trên chứng thư số được cung cấp.
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1">
                            <span className="sr-only">Import</span>
                            <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-center text-sm font-medium">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".cer,.pem,.crt"
                                    onChange={handleCertificateImport}
                                />
                                Import
                            </div>
                        </label>

                        <button
                            onClick={handleGetCertificate}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm font-medium"
                        >
                            Lấy chứng thư số
                        </button>
                    </div>
                </div>
            </div>

            {/* Phần còn lại giữ nguyên */}
            {verificationResult ? (
                <div className={`p-4 rounded-lg mb-6 ${verificationResult.success
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    <p className="font-medium">{verificationResult.message}</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-6">
                    <VerifyIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-center">
                        {isVerifying
                            ? 'Đang xác thực văn bản...'
                            : 'Nhấn "Xác thực" để kiểm tra tính hợp lệ của văn bản'}
                    </p>
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Quay lại
                </button>
                {!verificationResult && (
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center ${isVerifying ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                    >
                        {isVerifying && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Xác thực
                    </button>
                )}
            </div>
        </div>
    );
};

// Thêm CertificateIcon
const CertificateIcon = (props) => (
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
    </svg>
);

// Giữ nguyên DocumentIcon và VerifyIcon
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

export default VerificationInterface;