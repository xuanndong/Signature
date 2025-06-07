import { useState, useRef, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer'; // Cần cài đặt thư viện

const SignatureInterface = ({ file, onBack, onComplete }) => {
    const [signature, setSignature] = useState(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isSigning, setIsSigning] = useState(false);
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(1);
    const documentRef = useRef(null);

    // Xử lý khi người dùng bắt đầu ký
    const startSigning = (e) => {
        if (!isSigning) return;

        const rect = canvasRef.current.getBoundingClientRect();
        setPosition({
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        });
    };

    // Xử lý khi người dùng di chuyển chuột để ký
    const handleSigning = (e) => {
        if (!isSigning) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const newX = (e.clientX - rect.left) / scale;
        const newY = (e.clientY - rect.top) / scale;

        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(newX, newY);
        ctx.strokeStyle = '#2563eb'; // Màu xanh
        ctx.lineWidth = 2;
        ctx.stroke();

        setPosition({ x: newX, y: newY });
    };

    // Xử lý hoàn thành ký
    const completeSigning = () => {
        setIsSigning(false);
        // Lưu chữ ký vào state
        setSignature(canvasRef.current.toDataURL());
    };

    // Xử lý khi nhấn nút hoàn thành
    const handleComplete = () => {
        // Tạo file mới đã ký (giả lập)
        const signedFile = new File([file], `signed_${file.name}`, {
            type: file.type,
            lastModified: new Date()
        });

        onComplete(signedFile);
    };

    // Xử lý phóng to/thu nhỏ
    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

    return (
        <div className="max-w-6xl mx-auto p-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Ký số văn bản</h2>
                    <button
                        onClick={onBack}
                        className="px-3 py-1 bg-white text-indigo-600 rounded-md hover:bg-indigo-50"
                    >
                        Quay lại
                    </button>
                </div>

                {/* Main content */}
                <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Document viewer */}
                        <div className="flex-1 border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 p-2 flex justify-between items-center">
                                <span className="text-sm font-medium">{file.name}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={zoomOut}
                                        className="px-2 py-1 bg-white border rounded-md"
                                        disabled={scale <= 0.5}
                                    >
                                        -
                                    </button>
                                    <span className="px-2 py-1">{Math.round(scale * 100)}%</span>
                                    <button
                                        onClick={zoomIn}
                                        className="px-2 py-1 bg-white border rounded-md"
                                        disabled={scale >= 2}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="relative overflow-auto h-[500px] border-t">
                                {file.type === 'application/pdf' ? (
                                    <PDFViewer width="100%" height="100%">
                                        {/* Hiển thị PDF - cần triển khai thực tế */}
                                        <div className="flex items-center justify-center h-full bg-gray-50">
                                            <p className="text-gray-500">PDF Viewer Placeholder</p>
                                        </div>
                                    </PDFViewer>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-50">
                                        <p className="text-gray-500">Xem trước tài liệu</p>
                                    </div>
                                )}
                                
                            </div>
                        </div>

                        {/* Signature controls */}
                        <div className="md:w-80 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-lg mb-4">Thông tin ký số</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vị trí chữ ký
                                    </label>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 max-w-md bg-white border rounded-sm text-sm">
                                            
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thông tin người ký
                                    </label>
                                    <div className="bg-white p-3 rounded-md border text-sm">
                                        <p className="font-medium">Nguyễn Văn A</p>
                                        <p className="text-gray-600">Công ty ABC</p>
                                        <p className="text-gray-600">Serial: 1234-5678-9012</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleComplete}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Xác nhận ký số
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureInterface;