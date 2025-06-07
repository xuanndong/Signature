import { useEffect, useState } from "react";
import FileList from "../components/FileList";
import EmptyState from "../components/EmptyState";

const Dashboard = ({ activePath, user }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDocuments();
        console.log("abc")
    }, [activePath]); // mỗi lần activePath thay đổi thì fetch thay đổi

    const fetchDocuments = () => {
        setLoading(true);
        setTimeout(() => {
            setDocuments([
                {
                    id: 1,
                    name: 'Hợp đồng lao động dài tên để kiểm tra responsive behavior',
                    format: 'PDF',
                    date: '2023-05-15 14:30',
                    status: 'Chưa ký',
                },
                {
                    id: 2,
                    name: 'Báo cáo tài chính Q1',
                    format: 'DOCX',
                    date: '2023-06-20 09:15',
                    status: 'Đã ký',
                },
                {
                    id: 3,
                    name: 'Đề xuất dự án mới',
                    format: 'PDF',
                    date: '2023-07-10 16:45',
                    status: 'Đã xác thực',
                },
                {
                    id: 1,
                    name: 'Hợp đồng lao động dài tên để kiểm tra responsive behavior',
                    format: 'PDF',
                    date: '2023-05-15 14:30',
                    status: 'Chưa ký',
                },
                {
                    id: 2,
                    name: 'Báo cáo tài chính Q1',
                    format: 'DOCX',
                    date: '2023-06-20 09:15',
                    status: 'Đã ký',
                },
                {
                    id: 3,
                    name: 'Đề xuất dự án mới',
                    format: 'PDF',
                    date: '2023-07-10 16:45',
                    status: 'Đã xác thực',
                },
                
            ]);
            setLoading(false);
        }, 500);
    };

    return (
        <div className="overflow-hidden bg-gray-50">
            <div className="container mx-auto px-2 sm:px-4 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Danh sách văn bản</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <EmptyState
                        title="Chưa có tài liệu nào"
                        description="Bạn chưa tải lên tài liệu nào. Hãy bắt đầu bằng cách tải lên tài liệu đầu tiên."
                        actionText="Tải lên tài liệu"
                        onAction={() => onNavigate("/documents")}
                    />
                ) : (
                    <FileList documents={documents} />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
