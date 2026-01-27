"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { dashboardAPI, productAPI } from "@/services/apiService";
import { CardSkeleton, TableSkeleton } from "@/components/Skeleton";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStock: any[];
  recentOrders: any[];
}

export default function DashboardPage() {
  useAuth(["admin", "manager", "staff"]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, productsRes] = await Promise.all([
        dashboardAPI.getStats(),
        productAPI.getProducts(),
      ]);

      setStats(dashboardRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-72 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <TableSkeleton rows={5} columns={3} />
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <TableSkeleton rows={5} columns={4} />
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    {
      title: "Total Products",
      value: products.length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-400/30",
    },
    {
      title: "Low Stock Items",
      value: products.filter((p: any) => p.stock < 2 && p.stock > 0).length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconBg: "bg-orange-400/30",
    },
    {
      title: "Out of Stock",
      value: products.filter((p: any) => p.stock === 0).length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-400/30",
    },
    {
      title: "Total Sales",
      value: `$${stats?.totalSales.toFixed(2) || 0}`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-400/30",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-400/30",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      iconBg: "bg-amber-400/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Mini ERP System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={`${tile.bgColor} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium opacity-90">{tile.title}</p>
                <p className="text-3xl font-bold mt-2">{tile.value}</p>
              </div>
              <div className={`${tile.iconBg} rounded-lg p-3`}>
                {tile.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Recent Orders
            </h2>
            <span className="text-sm text-gray-500">Last 5 orders</span>
          </div>
          <div className="space-y-3">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.customerId?.name || "N/A"} - {order.customerId?.phone || ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent orders found</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Stock Alert
            </h2>
            <span className="text-sm text-gray-500">Items to restock</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.filter((p: any) => p.stock < 2 && p.stock > 0).length > 0 ? (
              products.filter((p: any) => p.stock < 2 && p.stock > 0).map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-100 to-orange-200">
                        <span className="text-orange-600 font-bold text-lg">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-xs text-orange-600 font-medium">{product.stock} left in stock</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
