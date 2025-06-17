import { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Notification from './Notification';
import { signPdf } from '../api';

// Cấu hình worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const SignatureInterface = ({ file, onBack, user, handleUploadSuccess }) => {
    // State management
    const [pdfState, setPdfState] = useState({
        scale: 1,
        currentPage: 1,
        totalPages: 0,
        isLoading: true,
        error: null
    });

    const [signatureState, setSignatureState] = useState({
        position: null,
        isSigning: false,
        notification: null
    });

    // Refs
    const canvasRef = useRef(null);
    const pdfDocumentRef = useRef(null);
    const renderTaskRef = useRef(null);

    // Load PDF document
    useEffect(() => {
        let isMounted = true;

        const loadPdfDocument = async () => {
            try {
                if (!file) throw new Error('No file selected');

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({
                    data: arrayBuffer,
                    disableFontFace: false,
                    disableRange: false,
                    disableStream: false,
                    enableXfa: true
                }).promise;

                if (!isMounted) return;

                pdfDocumentRef.current = pdf;
                setPdfState(prev => ({
                    ...prev,
                    totalPages: pdf.numPages,
                    isLoading: false,
                    error: null
                }));

                renderCurrentPage();

            } catch (error) {
                if (isMounted) {
                    console.error('PDF loading error:', error);
                    setPdfState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error.message || 'Failed to load PDF document'
                    }));
                }
            }
        };

        loadPdfDocument();

        return () => {
            isMounted = false;
        };
    }, [file]);

    // Render current page
    const renderCurrentPage = useCallback(async () => {
        if (!pdfDocumentRef.current || !canvasRef.current || pdfState.isLoading) return;

        cancelRenderTask();

        try {
            const page = await pdfDocumentRef.current.getPage(pdfState.currentPage);
            const viewport = page.getViewport({ scale: pdfState.scale });
            const canvas = canvasRef.current;

            // Adjust canvas dimensions
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = '100%';
            canvas.style.height = 'auto';

            // Render PDF page
            renderTaskRef.current = page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            });

            await renderTaskRef.current.promise;
        } catch (error) {
            if (!(error instanceof pdfjsLib.RenderingCancelledException)) {
                console.error('Render error:', error);
                setPdfState(prev => ({
                    ...prev,
                    error: 'Error rendering PDF page'
                }));
            }
        }
    }, [pdfState.currentPage, pdfState.scale, pdfState.isLoading]);

    // Cancel current render task
    const cancelRenderTask = () => {
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
        }
    };

    // Handle page changes
    useEffect(() => {
        if (pdfDocumentRef.current && !pdfState.isLoading) {
            renderCurrentPage();
        }
    }, [pdfState.currentPage, pdfState.scale, renderCurrentPage]);

    // Handle canvas click for signature position
    const handleCanvasClick = (e) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Tính toán vị trí click chính xác
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSignatureState(prev => ({
            ...prev,
            position: {
                page: pdfState.currentPage,
                x: x,
                y: y,
                scale: pdfState.scale,
                viewportWidth: canvas.width,
                viewportHeight: canvas.height,
                displayWidth: rect.width,
                displayHeight: rect.height
            }
        }));
    };

    // Navigation handlers
    const goToPrevPage = () => {
        if (pdfState.currentPage > 1) {
            setPdfState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
        }
    };

    const goToNextPage = () => {
        if (pdfState.currentPage < pdfState.totalPages) {
            setPdfState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
        }
    };

    const zoomIn = () => {
        setPdfState(prev => ({
            ...prev,
            scale: Math.min(prev.scale + 0.25, 3)
        }));
    };

    const zoomOut = () => {
        setPdfState(prev => ({
            ...prev,
            scale: Math.max(prev.scale - 0.25, 0.5)
        }));
    };

    // Handle PDF signing
    const handleSignPdf = async () => {
        if (!signatureState.position) {
            setSignatureState(prev => ({
                ...prev,
                notification: {
                    type: 'error',
                    message: 'Vui lòng chọn vị trí chữ ký trên tài liệu',
                    duration: 3000 // 3 giây
                }
            }));
            return;
        }

        try {
            setSignatureState(prev => ({ ...prev, isSigning: true, notification: null }));

            const result = await signPdf(file, signatureState.position);

            setSignatureState(prev => ({
                ...prev,
                isSigning: false,
                notification: {
                    type: 'success',
                    message: `Tài liệu đã được ký thành công! ${new Date(result.signingTime).toLocaleString()}`,
                    duration: 5000 // 5 giây
                }
            }));
        } catch (error) {
            console.error('Signing error:', error);
            setSignatureState(prev => ({
                ...prev,
                isSigning: false,
                notification: {
                    type: 'error',
                    message: error.message || 'Đã xảy ra lỗi trong quá trình ký tài liệu',
                    duration: 5000 // 5 giây
                }
            }));
        }
    };


    // Close notification
    const closeNotification = () => {
        setSignatureState(prev => ({ ...prev, notification: null }));
    };

    return (
        <div className="max-w-6xl mx-auto p-2 md:p-4 bg-white rounded-xl shadow-md">
            {/* Notification */}
            {signatureState.notification && (
                <Notification
                    type={signatureState.notification.type}
                    message={signatureState.notification.message}
                    onClose={closeNotification}
                    onBack={onBack}
                    handleUploadSuccess={handleUploadSuccess}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Chữ ký số</h2>
                <button
                    onClick={onBack}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* File Info */}
            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <DocumentIcon className="h-10 w-10 text-blue-500 mr-4" />
                    <div>
                        <h3 className="font-medium text-gray-800 truncate max-w-xs">{file.name}</h3>
                        <p className="text-sm text-gray-500">{file.type}</p>
                    </div>
                </div>

                {/* Error State */}
                {pdfState.error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{pdfState.error}</p>
                    </div>
                ) :

                    /* Loading State */
                    pdfState.isLoading ? (
                        <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-3">Loading document...</span>
                        </div>
                    ) :

                        /* Main Content */
                        (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* PDF Viewer Section */}
                                <div className="flex-1">
                                    <div className="bg-gray-50 p-3 flex justify-between items-center rounded-t-lg border border-gray-200">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm font-medium text-gray-700">
                                                Page {pdfState.currentPage} of {pdfState.totalPages}
                                            </span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={goToPrevPage}
                                                    disabled={pdfState.currentPage <= 1}
                                                    className="p-1.5 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                                                    aria-label="Previous page"
                                                >
                                                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={goToNextPage}
                                                    disabled={pdfState.currentPage >= pdfState.totalPages}
                                                    className="p-1.5 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                                                    aria-label="Next page"
                                                >
                                                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={zoomOut}
                                                disabled={pdfState.scale <= 0.5}
                                                className="p-1.5 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                                                aria-label="Zoom out"
                                            >
                                                <MinusIcon className="h-5 w-5 text-gray-600" />
                                            </button>
                                            <span className="px-2 text-sm font-medium text-gray-700">
                                                {Math.round(pdfState.scale * 100)}%
                                            </span>
                                            <button
                                                onClick={zoomIn}
                                                disabled={pdfState.scale >= 3}
                                                className="p-1.5 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                                                aria-label="Zoom in"
                                            >
                                                <PlusIcon className="h-5 w-5 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative border border-t-0 border-gray-200 rounded-b-lg overflow-auto bg-gray-100" style={{ height: '60vh' }}>
                                        <div className="flex justify-center items-start h-full p-4">
                                            <canvas
                                                ref={canvasRef}
                                                onClick={handleCanvasClick}
                                                className="shadow-md cursor-crosshair bg-white"
                                                aria-label="PDF document"
                                            />
                                        </div>

                                        {/* Signature position indicator */}
                                        {signatureState.position?.page === pdfState.currentPage && (
                                            <div
                                                className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 flex flex-col items-center justify-center pointer-events-none"
                                                style={{
                                                    left: `${signatureState.position.x}px`,
                                                    top: `${signatureState.position.y}px`,
                                                    width: '200px',
                                                    height: '60px',
                                                    transform: 'translate(0, -100%)'
                                                }}
                                            >
                                                <div className="text-xs p-1 bg-blue-500 text-white w-full text-center">
                                                    Vị trí ký
                                                </div>
                                                <div className="text-xs p-1 text-center text-gray-700">
                                                    Trang {signatureState.position.page}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Signature Panel */}
                                <div className="lg:w-80 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-lg mb-4 text-gray-800">Thông tin chữ ký</h3>

                                    <div className="space-y-4">
                                        {/* Position Info */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vị trí chữ ký
                                            </label>
                                            {signatureState.position ? (
                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-center mb-3">
                                                        <div className="bg-green-100 p-2 rounded-full mr-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">Vị trí đã chọn</p>
                                                            <p className="text-xs text-gray-500">Nhấn vào tài liệu để thay đổi</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-2 rounded">
                                                        <div className="text-center">
                                                            <p className="text-gray-500">Trang</p>
                                                            <p className="font-medium text-gray-700">{signatureState.position.page}/{pdfState.totalPages}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-gray-500">Tọa độ X</p>
                                                            <p className="font-medium text-gray-700">{Math.round(signatureState.position.x)}px</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-gray-500">Tọa độ Y</p>
                                                            <p className="font-medium text-gray-700">{Math.round(signatureState.position.y)}px</p>
                                                        </div>
                                                    </div>

                                                    {/* <div className="mt-2 text-xs text-gray-500">
                                                        <p>Tỷ lệ zoom: {Math.round(pdfState.scale * 100)}%</p>
                                                        <p>Kích thước hiển thị: {Math.round(signatureState.position.viewportWidth)}×{Math.round(signatureState.position.viewportHeight)}px</p>
                                                    </div> */}
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded flex items-start">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-yellow-700 mb-1">Chưa chọn vị trí</p>
                                                        <p className="text-xs text-yellow-600">Vui lòng nhấn vào tài liệu bên cạnh để chọn vị trí đặt chữ ký số</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Signer Info */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Thông tin người ký
                                            </label>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                                <div className="flex items-center">
                                                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{user.username}</p>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-gray-100">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Tổ chức</p>
                                                            <p className="font-medium text-gray-700">{user.organization || "Trường DH HAUI"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Chức vụ</p>
                                                            <p className="font-medium text-gray-700">{user.position || "Sinh viên"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* <div className="bg-blue-50 p-2 rounded text-center text-xs text-blue-700">
                                                    <p>Chứng thư số: {user.certificateId || "SERIAL-1234-5678"}</p>
                                                    <p>Có hiệu lực đến: {user.certificateExpiry || "31/12/2025"}</p>
                                                </div> */}
                                            </div>
                                        </div>

                                        {/* Sign Button */}
                                        <div className="pt-4">
                                            <button
                                                onClick={handleSignPdf}
                                                disabled={!signatureState.position || signatureState.isSigning}
                                                className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center ${signatureState.position && !signatureState.isSigning
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {signatureState.isSigning ? (
                                                    <>
                                                        <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                                        Đang ký...
                                                    </>
                                                ) : (
                                                    <>
                                                        <SignatureIcon className="w-5 h-5 mr-2" />
                                                        Xác nhận chữ ký
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
            </div>
        </div>
    );
};

// Icon Components
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

const SignatureIcon = (props) => (
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
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
    </svg>
);

const ChevronLeftIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const PlusIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const MinusIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const SpinnerIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default SignatureInterface;