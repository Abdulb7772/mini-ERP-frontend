"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

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

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [totalProducts, setTotalProducts] = useState(0);

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
      setTotalProducts(expandedProducts.length);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Login/Signup Button (Left) */}
            <div className="flex items-center space-x-3">
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
            </div>

            {/* Brand Name (Center) */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Mini ERP
              </h1>
            </div>

            {/* Empty div for spacing */}
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h2>
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
                <div className="h-48 bg-linear-to-br from-purple-100 to-indigo-100 relative overflow-hidden">
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

                  {/* View Details Button */}
                  <button
                    onClick={handleLogin}
                    className="w-full px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                  >
                    Login to Purchase
                  </button>
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
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 bg-linear-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Mini ERP
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Your complete business management solution for inventory, orders, and customer management.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-sm hover:text-white transition">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/products" className="text-sm hover:text-white transition">
                    Products
                  </a>
                </li>
                <li>
                  <a href="/login" className="text-sm hover:text-white transition">
                    Login
                  </a>
                </li>
                <li>
                  <a href="/register" className="text-sm hover:text-white transition">
                    Sign Up
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white transition">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-gray-400 mb-4">
                Subscribe to get updates on new products and features.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-r-lg hover:bg-purple-700 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Mini ERP. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Cookie Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
