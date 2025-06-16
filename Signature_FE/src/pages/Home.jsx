import React from 'react';

const Home = ({ onLoginClick, onSignUpClick }) => {
    return (
        <div className="min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center p-4 absolute top-0">
                <div className="text-2xl font-bold text-indigo-600">nasSign</div>
                <div className="flex gap-4">
                    <button 
                        onClick={onLoginClick}
                        className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Đăng nhập
                    </button>
                    <button 
                        onClick={onSignUpClick}
                        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                        Đăng ký
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-6xl mt-16">
                {/* Left Column - Hero Text */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                        Ký số dễ dàng với <span className="text-indigo-600">nasSign</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-lg">
                        Giải pháp ký số điện tử an toàn, tiện lợi và được pháp lý công nhận. 
                        Ký mọi tài liệu chỉ với vài cú nhấp chuột, mọi lúc mọi nơi.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button 
                            onClick={onLoginClick}
                            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300 shadow-md"
                        >
                            Đăng nhập
                        </button>
                        <button 
                            onClick={onSignUpClick}
                            className="cursor-pointer border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium py-3 px-6 rounded-lg transition duration-300"
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>

                {/* Right Column - Hero Image */}
                <div className="flex-1 flex justify-center mb-15">
                    <div className="w-full max-w-xs bg-white p-4 rounded-xl shadow-xl">
                        <img
                            src="src/assets/Signature.png"
                            alt="Ký số điện tử"
                            className="h-auto rounded-lg object-cover"
                        />
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="w-full max-w-6xl my-15">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Tính năng nổi bật</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-indigo-600 mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Bảo mật cao</h3>
                        <p className="text-gray-600">Sử dụng công nghệ mã hóa tiên tiến, đảm bảo an toàn cho tài liệu của bạn.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-indigo-600 mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Hợp pháp</h3>
                        <p className="text-gray-600">Chữ ký số có giá trị pháp lý theo quy định của pháp luật hiện hành.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-indigo-600 mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Tiện lợi</h3>
                        <p className="text-gray-600">Ký tài liệu mọi lúc mọi nơi, không cần in ấn hay gặp mặt trực tiếp.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full max-w-6xl text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} nasSign. Tất cả quyền được bảo lưu.
            </footer>
        </div>
    );
};

export default Home;