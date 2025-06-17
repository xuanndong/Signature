import React, { useState } from 'react';
import { generateKeys, signData, verifyData } from '../api';

const Text = ({ user }) => {
    const [userId, setUserId] = useState(user.user_id);
    const [dataToSign, setDataToSign] = useState('');
    const [signature, setSignature] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [dataToVerify, setDataToVerify] = useState('');
    const [keyResult, setKeyResult] = useState(null);
    const [signResult, setSignResult] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [isLoading, setIsLoading] = useState({
        generate: false,
        sign: false,
        verify: false
    });

    // State để quản lý hiển thị key
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [showPublicKey, setShowPublicKey] = useState(false);

    const handleGenerateKeys = async () => {
        setIsLoading(prev => ({ ...prev, generate: true }));
        try {
            const result = await generateKeys(userId);
            setPublicKey(result.publicKey);
            setKeyResult({
                success: true,
                message: 'Đã lấy cặp khóa thành công!',
                publicKey: result.publicKey,
                privateKey: result.privateKey
            });
        } catch (error) {
            setKeyResult({
                success: false,
                message: error.message
            });
        } finally {
            setIsLoading(prev => ({ ...prev, generate: false }));
        }
    };

    const handleSignData = async () => {
        setIsLoading(prev => ({ ...prev, sign: true }));
        try {
            const result = await signData(dataToSign);
            setSignature(result.signature);
            setDataToVerify(dataToSign);

            setSignResult({
                success: true,
                message: 'Ký thành công!',
                signature: result.signature
            });
        } catch (error) {
            setSignResult({
                success: false,
                message: error.message
            });
        } finally {
            setIsLoading(prev => ({ ...prev, sign: false }));
        }
    };

    const handleVerifySignature = async () => {
        setIsLoading(prev => ({ ...prev, verify: true }));
        try {
            const result = await verifyData(dataToVerify, signature, publicKey);
            setVerifyResult({
                valid: result.valid,
                message: result.message
            });
        } catch (error) {
            setVerifyResult({
                valid: false,
                message: error.message
            });
        } finally {
            setIsLoading(prev => ({ ...prev, verify: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Test Ký số và Xác thực</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Panel bên trái - Tạo khóa và Ký dữ liệu */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Quản lý khóa</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">User ID</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập User ID"
                            />
                        </div>
                        <button
                            onClick={handleGenerateKeys}
                            disabled={isLoading.generate}
                            className={`w-full py-2 px-4 rounded-md transition duration-200 ${isLoading.generate
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isLoading.generate ? 'Đang tải...' : 'Lấy cặp khóa'}
                        </button>

                        {keyResult && (
                            <div className={`mt-4 p-4 rounded-md ${keyResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                <p>{keyResult.message}</p>
                                {keyResult.privateKey && (
                                    <>
                                        <div className="flex items-center justify-between mt-3 mb-2">
                                            <label className="block text-gray-700">Private Key:</label>
                                            <button
                                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                                className="text-gray-500 hover:text-gray-700"
                                                aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
                                            >
                                                {showPrivateKey ? (
                                                    <EyeSlashIcon className="h-5 w-5" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={showPrivateKey ? keyResult.privateKey : '••••••••••••••••••••••••••••••••'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                                            rows="5"
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-700">Ký dữ liệu</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Văn bản cần ký</label>
                            <textarea
                                value={dataToSign}
                                onChange={(e) => setDataToSign(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="5"
                                placeholder="Nhập văn bản cần ký"
                            />
                        </div>
                        <button
                            onClick={handleSignData}
                            disabled={isLoading.sign || !publicKey}
                            className={`w-full py-2 px-4 rounded-md transition duration-200 ${isLoading.sign || !publicKey
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            {isLoading.sign ? 'Đang ký...' : 'Ký dữ liệu'}
                        </button>

                        {signResult && (
                            <div className={`mt-4 p-4 rounded-md ${signResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                <p>{signResult.message}</p>
                                {/* {signResult.signature && (
                                    <>
                                        <label className="block text-gray-700 mt-3 mb-2">Chữ ký:</label>
                                        <textarea
                                        readOnly
                                        value={signResult.signature}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                                        rows="3"
                                        />
                                    </>
                                )} */}
                            </div>
                        )}
                    </div>

                    {/* Panel bên phải - Xác thực */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Xác thực chữ ký</h2>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Dữ liệu gốc</label>
                            <textarea
                                value={dataToVerify}
                                onChange={(e) => setDataToVerify(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Dữ liệu gốc"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Chữ ký</label>
                            <textarea
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                className="w-full px-3 py-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Chữ ký"
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-700">Public Key</label>
                                <button
                                    onClick={() => setShowPublicKey(!showPublicKey)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label={showPublicKey ? "Hide public key" : "Show public key"}
                                >
                                    {showPublicKey ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <textarea
                                value={showPublicKey ? publicKey : '••••••••••••••••••••••••••••••••'}
                                onChange={(e) => setPublicKey(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                rows="5"
                                placeholder="Public Key"
                            />
                        </div>

                        <button
                            onClick={handleVerifySignature}
                            disabled={isLoading.verify || !signature || !publicKey}
                            className={`w-full py-2 px-4 rounded-md transition duration-200 ${isLoading.verify || !signature || !publicKey
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                        >
                            {isLoading.verify ? 'Đang xác thực...' : 'Xác thực'}
                        </button>

                        {verifyResult && (
                            <div className={`mt-4 p-4 rounded-md ${verifyResult.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                <p>{verifyResult.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Text;


const EyeIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);


const EyeSlashIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

