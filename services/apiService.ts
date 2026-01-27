import axiosInstance from "./axios";

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    axiosInstance.post("/auth/login", { email, password }),
  
  register: (name: string, email: string, password: string, role?: string) =>
    axiosInstance.post("/auth/register", { name, email, password, role }),
  
  getMe: () => axiosInstance.get("/auth/me"),
};

// User APIs
export const userAPI = {
  getUsers: (params?: any) => axiosInstance.get("/users", { params }),
  createUser: (data: any) => axiosInstance.post("/users", data),
  updateUser: (id: string, data: any) => axiosInstance.put(`/users/${id}`, data),
  deleteUser: (id: string) => axiosInstance.delete(`/users/${id}`),
  toggleUserStatus: (id: string) => axiosInstance.patch(`/users/${id}/toggle-status`),
  resendVerificationEmail: (id: string) => axiosInstance.post(`/users/${id}/resend-verification`),
};

// Product APIs
export const productAPI = {
  getProducts: (params?: any) => axiosInstance.get("/products", { params }),
  getProduct: (id: string) => axiosInstance.get(`/products/${id}`),
  createProduct: (data: any) => axiosInstance.post("/products", data),
  updateProduct: (id: string, data: any) => axiosInstance.put(`/products/${id}`, data),
  deleteProduct: (id: string) => axiosInstance.delete(`/products/${id}`),
  updateProductStock: (id: string, stock: number) => 
    axiosInstance.patch(`/products/${id}/stock`, { stock }),
  updateVariationStock: (id: string, stock: number) => 
    axiosInstance.patch(`/products/variations/${id}/stock`, { stock }),
};

// Inventory APIs
export const inventoryAPI = {
  stockIn: (data: any) => axiosInstance.post("/inventory/stock-in", data),
  stockOut: (data: any) => axiosInstance.post("/inventory/stock-out", data),
  getLogs: (params?: any) => axiosInstance.get("/inventory/logs", { params }),
  getLowStock: (params?: any) => axiosInstance.get("/inventory/low-stock", { params }),
};

// Customer APIs
export const customerAPI = {
  getCustomers: (params?: any) => axiosInstance.get("/customers", { params }),
  getCustomer: (id: string) => axiosInstance.get(`/customers/${id}`),
  createCustomer: (data: any) => axiosInstance.post("/customers", data),
  updateCustomer: (id: string, data: any) => axiosInstance.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => axiosInstance.delete(`/customers/${id}`),
};

// Order APIs
export const orderAPI = {
  getOrders: (params?: any) => axiosInstance.get("/orders", { params }),
  getOrder: (id: string) => axiosInstance.get(`/orders/${id}`),
  createOrder: (data: any) => axiosInstance.post("/orders", data),
  updateOrderStatus: (id: string, status: string) =>
    axiosInstance.patch(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    axiosInstance.patch(`/orders/${id}/payment-status`, { paymentStatus }),
  cancelOrder: (id: string) => axiosInstance.post(`/orders/${id}/cancel`),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => axiosInstance.get("/dashboard/stats"),
};

// Attendance APIs
export const attendanceAPI = {
  getAttendanceByDate: (date: string) => 
    axiosInstance.get("/attendance", { params: { date } }),
  getMyAttendance: (date: string) =>
    axiosInstance.get("/attendance/my-attendance", { params: { date } }),
  checkIn: (userId: string, date: string) => 
    axiosInstance.post("/attendance/check-in", { userId, date }),
  checkOut: (userId: string, date: string) => 
    axiosInstance.post("/attendance/check-out", { userId, date }),
  getHistory: (params?: any) => 
    axiosInstance.get("/attendance/history", { params }),
};
