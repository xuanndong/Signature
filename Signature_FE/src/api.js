const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
const API_AUTH = import.meta.env.VITE_APP_AUTH_API;
const API_KEY = import.meta.env.VITE_APP_KEY_API;
const API_DOCUMENT = import.meta.env.VITE_APP_DOCUMENT_API;

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
};

// Xử lý lưu token và user data
const storeAuthData = (tokenResponse) => {
  localStorage.setItem('access_token', tokenResponse.access_token);
  localStorage.setItem('refresh_token', tokenResponse.refresh_token);

  const tokenData = decodeToken(tokenResponse.access_token);
  if (tokenData) {
    localStorage.setItem('user_id', tokenData.sub);
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    storeAuthData(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signup = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_AUTH}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    const data = await response.json();
    storeAuthData(data);
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Khi token hết hạn, nên đăng xuất hoặc nếu xóa thì nên đăng xuất
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_AUTH}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    // Luôn xóa token dù API có thành công hay không
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');

    if (!response.ok) {
      const error = await response.json();
      console.error('Logout error:', error);
      throw new Error(error.detail || 'Logout failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_AUTH}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user info');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user info error:', error);
    throw error;
  }
};


export const getPublicCert = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/public`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch public key info')
    }

    return await response.json();

  } catch (error) {
    console.error('Get public key info error:', error);
    throw error;
  }
}

export const getPrivateCert = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/private`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch private key info')
    }

    return await response.json();

  } catch (error) {
    console.error('Get private key info error:', error);
    throw error;
  }
}

// chưa hoàn thành
export const updateUserProfile = async (userId, data) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/${API_AUTH}/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  return await response.json();
};

// Api sign and verify
export const verifyPDF = async (file, certificateInfo) => {

  const formData = new FormData();
  formData.append('file', file)
  formData.append('public_key', certificateInfo)

  try {

    const response = await fetch(`${API_BASE_URL}/${API_DOCUMENT}/verify-pdf`, {
      method: "POST",
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Nếu API trả về lỗi có cấu trúc
      if (responseData.status === "error") {
        throw new Error(responseData.message || "Verification failed");
      }
      // Nếu API trả về lỗi không có cấu trúc
      throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
    }

    // Trả về toàn bộ response data nếu thành công
    return {
      success: responseData.status === "success",
      isValid: responseData.data?.is_valid || false,
      message: responseData.message,
      details: {
        verificationTime: responseData.data?.verification_time,
      },
      rawData: responseData 
    };
  } catch (error) {
    console.error('Verify PDF error:', error);
  }
};


// Gọi API
export const signPdf = async (file, position) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('position', JSON.stringify({
    page: position.page,
    x: position.x,
    y: position.y,
  }));

  try {
    const response = await fetch(`${API_BASE_URL}/${API_DOCUMENT}/sign-pdf`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      // Try to get error message from response body if available
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    return {
      signature: responseData.data.signature_id,
      signingTime: responseData.data.signed_at,
      documentId: responseData.data.document_id,
      filename: responseData.data.filename
    };
  } catch (error) {
    console.error('Lỗi ký PDF:', error.message);
    throw new Error(error.message || 'Đã xảy ra lỗi khi ký PDF');
  }
};


export const getUserDocuments = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { data: null, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_BASE_URL}/${API_DOCUMENT}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: errorData.detail || 'Failed to fetch documents'
      };
    }

    const data = await response.json();
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching documents:', error);
    return {
      data: null,
      error: error.message || 'Network error occurred'
    };
  }
};


export const uploadDocument = async (file) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/${API_DOCUMENT}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Tải lên thất bại');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};


export const documentContent = async (documentId) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/document/${documentId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch document content');
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
};