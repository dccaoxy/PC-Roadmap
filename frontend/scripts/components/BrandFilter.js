/**
 * BrandFilter.js - 品牌筛选组件
 * 支持多选，选中状态高亮
 */

class BrandFilter {
  constructor({ container, onChange }) {
    this.container = container;
    this.onChange = onChange;
    this.selectedBrands = new Set();
    this.brands = [];
  }

  /**
   * 初始化 - 从 API 获取品牌列表并渲染
   */
  async init() {
    try {
      const response = await api.getBrands();
      this.brands = response.data || [];
      this.render();
    } catch (error) {
      console.error('Failed to load brands:', error);
      this.container.innerHTML = '<p class="error">加载品牌失败</p>';
    }
  }

  /**
   * 渲染品牌按钮
   */
  render() {
    if (!this.brands.length) {
      this.container.innerHTML = '<span class="empty-state">暂无可用品牌</span>';
      return;
    }

    const html = `
      <div class="brand-buttons">
        ${this.brands.map(brand => `
          <button 
            class="brand-btn ${this.selectedBrands.has(brand) ? 'active' : ''}" 
            data-brand="${brand}"
          >
            ${brand}
          </button>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  /**
   * 绑定点击事件
   */
  attachEvents() {
    const buttons = this.container.querySelectorAll('.brand-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const brand = btn.dataset.brand;
        this.toggleBrand(brand);
      });
    });
  }

  /**
   * 切换品牌选中状态
   */
  toggleBrand(brand) {
    if (this.selectedBrands.has(brand)) {
      this.selectedBrands.delete(brand);
    } else {
      this.selectedBrands.add(brand);
    }

    // 更新按钮样式
    const btn = this.container.querySelector(`[data-brand="${brand}"]`);
    if (btn) {
      btn.classList.toggle('active', this.selectedBrands.has(brand));
    }

    // 触发回调
    if (this.onChange) {
      this.onChange(Array.from(this.selectedBrands));
    }
  }

  /**
   * 获取选中的品牌列表
   */
  getSelected() {
    return Array.from(this.selectedBrands);
  }

  /**
   * 设置选中的品牌（外部调用）
   */
  setSelected(brands) {
    this.selectedBrands = new Set(brands);
    this.render();
  }

  /**
   * 清空选择
   */
  clear() {
    this.selectedBrands.clear();
    this.render();
    if (this.onChange) {
      this.onChange([]);
    }
  }
}

// 导出
window.BrandFilter = BrandFilter;
