import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// Brand API calls
export const fetchBrands = () => axios.get(`${API_URL}/brands`);
export const createBrand = (brand) => axios.post(`${API_URL}/brands`, brand);
export const updateBrand = (id, brand) => axios.put(`${API_URL}/brands/${id}`, brand);
export const deleteBrand = (id) => axios.delete(`${API_URL}/brands/${id}`);

// Category API calls
export const fetchCategories = () => axios.get(`${API_URL}/categories`);
export const createCategory = (category) => axios.post(`${API_URL}/categories`, category, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const updateCategory = (id, category) => axios.put(`${API_URL}/categories/${id}`, category, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const deleteCategory = (id) => axios.delete(`${API_URL}/categories/${id}`);

// SubCategory API calls
export const fetchSubCategories = () => axios.get(`${API_URL}/subcategories`);
export const createSubCategory = (subCategory) => axios.post(`${API_URL}/subcategories`, subCategory);
export const updateSubCategory = (id, subCategory) => axios.put(`${API_URL}/subcategories/${id}`, subCategory);
export const deleteSubCategory = (id) => axios.delete(`${API_URL}/subcategories/${id}`);

// Product API calls
export const fetchProducts = () => axios.get(`${API_URL}/products`);
export const addProduct = (product) => axios.post(`${API_URL}/products`, product);
export const updateProduct = (id, product) => axios.put(`${API_URL}/products/${id}`, product);
export const deleteProduct = (id) => axios.delete(`${API_URL}/products/${id}`);
