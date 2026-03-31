/**
 * API Module - 封装所有后端 API 调用
 * 默认 API 地址为 http://localhost:3000，可通过环境变量覆盖
 */

const API_BASE = (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE)
  ? window.ENV.API_BASE
  : 'http://localhost:3001';

/**
 * 通用 fetch 封装
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * ========== 产品相关 API ==========
 */

/**
 * 获取产品列表（支持筛选）
 * @param {Object} params - 筛选参数
 */
async function getProducts(params = {}) {
  const query = new URLSearchParams();
  
  if (params.brands && params.brands.length > 0) {
    query.set('brands', params.brands.join(','));
  }
  if (params.category) query.set('category', params.category);
  if (params.cpu) query.set('cpu', params.cpu);
  if (params.gpu) query.set('gpu', params.gpu);
  if (params.ram) query.set('ram', params.ram);
  if (params.storage) query.set('storage', params.storage);
  if (params.screen_size) query.set('screen_size', params.screen_size);

  const queryStr = query.toString();
  return apiRequest(`/api/products${queryStr ? `?${queryStr}` : ''}`);
}

/**
 * 获取单个产品详情
 * @param {number} id - 产品 ID
 */
async function getProduct(id) {
  return apiRequest(`/api/products/${id}`);
}

/**
 * 添加产品
 * @param {Object} productData - 产品数据
 */
async function addProduct(productData) {
  return apiRequest('/api/products', {
    method: 'POST',
    body: productData,
  });
}

/**
 * 更新产品
 * @param {number} id - 产品 ID
 * @param {Object} productData - 更新的数据
 */
async function updateProduct(id, productData) {
  return apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    body: productData,
  });
}

/**
 * 删除产品
 * @param {number} id - 产品 ID
 */
async function deleteProduct(id) {
  return apiRequest(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取所有品牌列表
 */
async function getBrands() {
  return apiRequest('/api/products/brands');
}

/**
 * 检查产品是否重复
 * @param {Object} productData - 产品数据
 */
async function checkDuplicate(productData) {
  const query = new URLSearchParams({ name: productData.name, brand: productData.brand, cpu: productData.cpu || '' });
  return apiRequest(`/api/products/check-duplicate?${query}`);
}

/**
 * ========== 链接解析 API ==========
 */

/**
 * 解析商品链接
 * @param {string} url - 商品链接
 */
async function parseLink(url) {
  return apiRequest('/api/links/parse', {
    method: 'POST',
    body: { url },
  });
}

// 导出所有 API 函数
window.api = {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getBrands,
  checkDuplicate,
  parseLink,
};
