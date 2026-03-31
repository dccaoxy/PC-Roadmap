/**
 * ProductCard.js - 悬浮卡片组件
 * hover 时显示产品信息
 */

class ProductCard {
  constructor() {
    this.card = null;
    this.currentProduct = null;
    this.visible = false;
    this.init();
  }

  /**
   * 初始化卡片 DOM
   */
  init() {
    // 创建卡片元素
    this.card = document.createElement('div');
    this.card.className = 'product-hover-card';
    this.card.innerHTML = `
      <img src="" alt="产品图片" class="product-image" style="display:none;" />
      <div class="product-name"></div>
      <div class="product-price"></div>
      <div class="product-meta">
        <span class="brand-category"></span>
        <span class="cpu-ram"></span>
        <span class="gpu"></span>
      </div>
    `;

    document.body.appendChild(this.card);
  }

  /**
   * 显示卡片
   * @param {Object} product - 产品数据
   * @param {MouseEvent} event - 鼠标事件
   */
  show(product, event) {
    if (!product) {
      this.hide();
      return;
    }

    this.currentProduct = product;
    this.updateContent(product);
    this.positionAtEvent(event);
    this.card.classList.add('visible');
    this.visible = true;
  }

  /**
   * 更新卡片内容
   */
  updateContent(product) {
    const nameEl = this.card.querySelector('.product-name');
    const priceEl = this.card.querySelector('.product-price');
    const brandCatEl = this.card.querySelector('.brand-category');
    const cpuRamEl = this.card.querySelector('.cpu-ram');
    const gpuEl = this.card.querySelector('.gpu');
    const imgEl = this.card.querySelector('.product-image');

    nameEl.textContent = product.name || '未知产品';
    priceEl.textContent = product.price ? `¥${product.price.toLocaleString()}` : '价格未知';

    const brand = product.brand || '';
    const category = product.category || '';
    brandCatEl.innerHTML = `<strong>品牌:</strong> ${brand} ${category ? '| ' + category : ''}`;

    const cpu = product.cpu || '-';
    const ram = product.ram || '-';
    cpuRamEl.innerHTML = `<strong>CPU:</strong> ${cpu} | <strong>内存:</strong> ${ram}`;

    const gpu = product.gpu || '-';
    gpuEl.innerHTML = `<strong>显卡:</strong> ${gpu}`;

    // 图片
    if (product.image_url) {
      imgEl.src = product.image_url;
      imgEl.style.display = 'block';
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
      };
    } else {
      imgEl.style.display = 'none';
    }
  }

  /**
   * 根据鼠标事件定位卡片
   * ECharts tooltip 在右边，ProductCard 强制放左边
   */
  positionAtEvent(event) {
    const padding = 15;
    const cardWidth = 280;
    const cardHeight = this.card.offsetHeight || 220;

    // 强制卡片显示在鼠标左边，避免和 ECharts tooltip 重叠
    let left = event.clientX - cardWidth - padding;
    let top = event.clientY + padding;

    // 边界检测 - 左侧
    if (left < padding) {
      left = event.clientX + padding;
    }

    // 边界检测 - 底部
    if (top + cardHeight > window.innerHeight - padding) {
      top = event.clientY - cardHeight - padding;
    }

    // 确保不超出左侧和顶部
    left = Math.max(padding, left);
    top = Math.max(padding, top);

    this.card.style.left = `${left}px`;
    this.card.style.top = `${top}px`;
  }

  /**
   * 移动卡片到指定位置（跟随鼠标）
   * ECharts tooltip 在右边，ProductCard 强制放左边
   */
  move(event) {
    if (!this.visible) return;

    const padding = 15;
    const cardWidth = 280;
    const cardHeight = this.card.offsetHeight || 220;

    // 强制卡片显示在鼠标左边
    let left = event.clientX - cardWidth - padding;
    let top = event.clientY + padding;

    if (left < padding) {
      left = event.clientX + padding;
    }

    if (top + cardHeight > window.innerHeight - padding) {
      top = event.clientY - cardHeight - padding;
    }

    left = Math.max(padding, left);
    top = Math.max(padding, top);

    this.card.style.left = `${left}px`;
    this.card.style.top = `${top}px`;
  }

  /**
   * 隐藏卡片
   */
  hide() {
    this.card.classList.remove('visible');
    this.visible = false;
    this.currentProduct = null;
  }

  /**
   * 获取当前产品
   */
  getCurrentProduct() {
    return this.currentProduct;
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.card && this.card.parentNode) {
      this.card.parentNode.removeChild(this.card);
    }
    this.card = null;
  }
}

// 导出
window.ProductCard = ProductCard;
