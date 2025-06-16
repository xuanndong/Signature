import { useEffect, useState } from "react";
import FileList from "../components/FileList";
import EmptyState from "../components/EmptyState";
import { getUserDocuments, getUserProfile } from "../api";
import UploadModal from "../components/UploadModal";

const Dashboard = ({ activePath }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false); // State quản lý modal
    const [signingFile, setSigningFile] = useState(null);
    const [verificationFile, setVerificationFile] = useState(null);
    const [user, setUser] = useState(null)

    useEffect(() => {
        fetchDocuments();
    }, [activePath]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);

        setUser(await getUserProfile())

        try {
            const { data, error } = await getUserDocuments();

            if (error) {
                setError(error);
                setDocuments([]);
                return;
            }

            if (data) {
                const formattedDocuments = data.map(doc => ({
                    id: doc.document_id,
                    name: doc.filename.replace(/\.[^/.]+$/, ""),
                    format: doc.filename.split('.').pop().toUpperCase(),
                    date: new Date(doc.created_at).toLocaleString('vi-VN'),
                    status: getStatusText(doc.status),
                }));

                setDocuments(formattedDocuments);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi tải dữ liệu');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleUploadSuccess = () => {
        setShowUploadModal(false);
        fetchDocuments(); // Load lại danh sách sau khi upload thành công
    };
    

    const getStatusText = (status) => {
        const statusMap = {
            'uploaded': 'Chưa ký',
            'signed': 'Đã ký',
            'verified': 'Đã xác thực',
            'verification_failed': 'Xác thực thất bại'
        };
        return statusMap[status] || status;
    };

    return (
        <div className="overflow-hidden bg-gray-50">
            {/* Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}

            <div className="container mx-auto px-2 sm:px-4 py-4">
                {!signingFile && !verificationFile  && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Danh sách văn bản</h2>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <EmptyState
                        title="Chưa có tài liệu nào"
                        description="Bạn chưa tải lên tài liệu nào. Hãy bắt đầu bằng cách tải lên tài liệu đầu tiên."
                        actionText="Tải lên tài liệu"
                        onAction={() => setShowUploadModal(true)}
                    />
                ) : (
                    <>
                        {!signingFile && !verificationFile && (
                            <div className="mb-4 flex justify-end">
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Tải lên tài liệu mới
                                </button>
                            </div>
                        )}
                        <FileList 
                            documents={documents} 
                            loading={loading} 
                            signingFile={signingFile} 
                            setSigningFile={setSigningFile} 
                            verificationFile={verificationFile} 
                            setVerificationFile={setVerificationFile}
                            user={user}
                            handleUploadSuccess={handleUploadSuccess}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;