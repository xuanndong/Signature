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
  console.log(certificateInfo)
  console.log(file)

  try {

    const response = await fetch(`${API_BASE_URL}/${API_DOCUMENT}/verify-pdf`, {
      method: "POST",
      body: formData, // Note: Don't set Content-Type header when using FormData
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: await response.text() };
      }

      const errorMessage = errorData.detail ||
        errorData.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Verify PDF error:', error);

    // Handle specific error cases
    let userMessage = error.message;
    if (error.name === 'AbortError') {
      userMessage = 'Request timeout. Please try again.';
    } else if (error.message.includes('Failed to fetch')) {
      userMessage = 'Network error. Please check your connection.';
    }

    throw new Error(userMessage);
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

    if (!response.ok) throw new Error('Ký PDF thất bại');

    // Lấy metadata từ headers
    const signature = response.headers.get('X-Signature');
    const signingTime = response.headers.get('X-Signing-Time');
    // Download file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed_${file.name}`;
    a.click();
    
    return { signature, signingTime };
  } catch (error) {
    console.error('Lỗi ký PDF:', error);
    throw error;
  }
};
