"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { orderAPI, customerAPI } from "@/services/apiService";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  imageUrl?: string;
  hasVariations: boolean;
  variations?: Array<{
    _id: string;
    name: string;
    price: number;
    stock: number;
    size?: string;
    color?: string;
  }>;
  variationDetails?: {
    name: string;
    size?: string;
    color?: string;
  };
}

export default function PublicProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      
      const queryString = params.toString();
      const url = `${baseURL}/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      const productsData = response.data.data;
      
      // Expand products with variations into separate items
      const expandedProducts: Product[] = [];
      
      for (const product of productsData) {
        if (product.hasVariations) {
          try {
            // Fetch full product details to get variations
            const detailResponse = await axios.get(`${baseURL}/products/${product._id}`);
            const productDetail = detailResponse.data.data;
            const variations = productDetail.variations || [];
            
            if (variations.length > 0) {
              // Create a separate product entry for each variation
              variations.forEach((variation: any) => {
                expandedProducts.push({
                  ...product,
                  _id: `${product._id}-${variation._id}`,
                  name: `${product.name} - ${variation.name}`,
                  price: variation.price,
                  stock: variation.stock,
                  sku: `${product.sku}-${variation._id}`,
                  hasVariations: false,
                  variationDetails: {
                    size: variation.size,
                    color: variation.color,
                    name: variation.name,
                  }
                });
              });
            } else {
              // If no variations found, add the product as-is
              expandedProducts.push(product);
            }
          } catch (error) {
            console.error(`Error fetching variations for product ${product._id}:`, error);
            // If error fetching variations, add the product as-is
            expandedProducts.push(product);
          }
        } else {
          // Add non-variational products as-is
          expandedProducts.push(product);
        }
      }
      
      setProducts(expandedProducts);
      
      // Fetch all categories separately (without filters) for the dropdown
      if (categories.length === 1) { // Only fetch once
        try {
          const allProductsResponse = await axios.get(`${baseURL}/products`);
          const allProducts = allProductsResponse.data.data;
          const uniqueCategories: string[] = ["All", ...Array.from(new Set<string>(allProducts.map((p: any) => p.category as string)))];
          setCategories(uniqueCategories);
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to view products");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/register");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleBackToDashboard = () => {
    if (session?.user?.role !== "customer") {
      router.push("/protected/dashboard");
    }
  };

  const handleOpenCartModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowCartModal(true);
  };

  const handleCloseCartModal = () => {
    setShowCartModal(false);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct || !session?.user) return;
    
    try {
      // First, get the customer's MongoDB ID using their email
      const customersResponse = await customerAPI.getCustomers();
      const customers = customersResponse.data.data;
      const customer = customers.find((c: any) => c.email === session.user.email);
      
      if (!customer) {
        toast.error("Customer profile not found. Please contact support.");
        return;
      }
      
      // Extract the original product ID (remove variation suffix if present)
      const productId = selectedProduct._id.includes('-') 
        ? selectedProduct._id.split('-')[0] 
        : selectedProduct._id;
      
      // Extract variation ID if it exists
      const variationId = selectedProduct.variationDetails && selectedProduct._id.includes('-')
        ? selectedProduct._id.split('-')[1]
        : null;
      
      // Build item object
      const item: any = {
        productId: productId,
        quantity: quantity,
      };
      
      // Only add variationId if it exists
      if (variationId) {
        item.variationId = variationId;
      }
      
      // Prepare order data with the correct MongoDB customer ID
      const orderData = {
        customerId: customer._id,
        items: [item],
        notes: `Order placed by customer via website`,
      };

      console.log("Sending order data:", JSON.stringify(orderData, null, 2));

      // Place the order
      const response = await orderAPI.createOrder(orderData);
      console.log("Order response:", response.data);

      // Update the stock of the product locally
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === selectedProduct._id 
            ? { ...p, stock: p.stock - quantity }
            : p
        )
      );
      
      toast.success(`Order placed successfully! Confirmation email sent.`);
      handleCloseCartModal();
    } catch (error: any) {
      console.error("Full error object:", JSON.stringify(error.response?.data, null, 2));
      const validationError = error.response?.data?.errors?.[0];
      const errorMsg = validationError?.msg || error.response?.data?.message || "Failed to place order";
      toast.error(`${errorMsg}${validationError?.path ? ` (${validationError.path})` : ''}`);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (selectedProduct && value >= 1 && value <= selectedProduct.stock) {
      setQuantity(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Mini ERP
              </h1>
              {session?.user && session.user.role !== "customer" && (
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition"
                >
                  ← Back to Dashboard
                </button>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{session.user.name}</span>
                    <span className="text-gray-500 ml-2">({session.user.role})</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={handleSignup}
                    className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{session?.user ? "Products" : "Our Products"}</h2>
          <p className="text-gray-600">Browse our collection of quality products</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== "All" || searchTerm) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory !== "All" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Search: &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{products.length}</span> product{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-indigo-100 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-20 h-20 text-purple-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Stock Badge */}
                  {product.stock > 0 ? (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      In Stock
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Category Badge */}
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded mb-2">
                    {product.category}
                  </span>

                  {/* Product Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}

                  {/* Price and Stock */}
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-xl font-bold text-purple-600">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.variationDetails && (
                        <div className="text-xs text-gray-500 mt-1">
                          {product.variationDetails.size && (
                            <span className="inline-block mr-2">Size: {product.variationDetails.size}</span>
                          )}
                          {product.variationDetails.color && (
                            <span className="inline-block">Color: {product.variationDetails.color}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className="text-lg font-semibold text-gray-900">{product.stock}</p>
                    </div>
                  </div>

                  {/* SKU */}
                  <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>

                  {/* Purchase/Login Button */}
                  {session?.user ? (
                    <button
                      onClick={() => handleOpenCartModal(product)}
                      disabled={product.stock === 0}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stock > 0 ? "Place Order" : "Out of Stock"}
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                    >
                      Login to Purchase
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} Mini ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add to Cart Modal */}
      {showCartModal && selectedProduct && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900">Place Order</h3>
              <button
                onClick={handleCloseCartModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product Image */}
              <div className="mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <svg className="w-20 h-20 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded mb-2">
                  {selectedProduct.category}
                </span>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedProduct.name}</h4>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedProduct.description.replace(/<[^>]*>/g, "")}
                  </p>
                )}
                {selectedProduct.variationDetails && (
                  <div className="text-sm text-gray-700 mb-3 space-y-1">
                    {selectedProduct.variationDetails.size && (
                      <p><span className="font-medium">Size:</span> {selectedProduct.variationDetails.size}</p>
                    )}
                    {selectedProduct.variationDetails.color && (
                      <p><span className="font-medium">Color:</span> {selectedProduct.variationDetails.color}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold text-purple-600">${selectedProduct.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.stock} in stock</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= selectedProduct.stock}
                    className="w-10 h-10 rounded-lg border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <div className="flex-1 text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-purple-600">
                      ${(selectedProduct.price * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseCartModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
