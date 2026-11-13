import api from './api.js';

// Posts
export const getPosts = (params) => api.get('/posts', { params });
export const getMyPosts = (params) => api.get('/posts/my-posts', { params });
export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);

// Comments
export const getComments = (postId) => api.get(`/posts/${postId}/comments`);
export const addComment = (postId, comment_text) => api.post(`/posts/${postId}/comments`, { comment_text });
export const updateComment = (id, comment_text) => api.put(`/comments/${id}`, { comment_text });
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);

// Profile
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);

// Image upload (returns { url })
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload', formData);
};
