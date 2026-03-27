/**
 * app.js - 主逻辑
 * 初始化各组件，协调筛选、图表、卡片等
 */

// 确保 echarts 全局可用
// 需要在 HTML 中先引入: <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>

class App {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.brandFilter = null;
    this.paramFilter = null;
    this.scatterPlot = null;
    this.productCard = null;
    this.toast = null;
  }

  /**
   * 初始化应用
   */
  async init() {
    this.initToast();
    this.bindLinkInput();
    await this.loadData();
    this.initComponents();
    this.bindEvents();
  }

  /**
   * 初始化 Toast 通知
   */
  initToast() {
    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    document.body.appendChild(this.toast);
  }

  /**
   * 显示 Toast 通知
   */
  showToast(message, type = 'info') {
    this.toast.textContent = message;
    this.toast.className = `toast ${type} visible`;

    setTimeout(() => {
      this.toast.classList.remove('visible');
    }, 3000);
  }

  /**
   * 绑定链接输入功能
   */
  bindLinkInput() {
    const addBtn = document.getElementById('add-product-btn');
    const linkInput = document.getElementById('product-link-input');

    if (addBtn && linkInput) {
      addBtn.addEventListener('click', () => this.handleAddProduct(linkInput.value));
      linkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleAddProduct(linkInput.value);
        }
      });
    }
  }

  /**
   * 处理添加产品
   */
  async handleAddProduct(url) {
    if (!url || !url.trim()) {
      this.showToast('请输入商品链接', 'warning');
      return;
    }

    const addBtn = document.getElementById('add-product-btn');
    addBtn.disabled = true;
    addBtn.textContent = '解析中...';

    try {
      // 1. 调用链接解析 API
      const parseResult = await api.parseLink(url.trim());

      if (!parseResult.success) {
        throw new Error(parseResult.error || '解析链接失败');
      }

      const productData = parseResult.data;

      // 2. 检测重复
      const dupResult = await api.checkDuplicate({
        name: productData.name,
        brand: productData.brand,
      });

      if (dupResult.isDuplicate && dupResult.existingProduct) {
        // 重复产品
        const goToDetail = confirm(`该产品已存在: ${dupResult.existingProduct.name}\n\n点击"确定"查看详情，或"取消"返回。`);
        if (goToDetail) {
          window.location.href = `product.html?id=${dupResult.existingProduct.id}`;
        }
        return;
      }

      // 3. 显示确认预览
      this.showConfirmModal(productData);

    } catch (error) {
      console.error('Add product error:', error);
      this.showToast(error.message || '解析链接失败，请检查链接是否正确', 'error');
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = '添加产品';
    }
  }

  /**
   * 显示确认弹窗
   */
  showConfirmModal(productData) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay visible';
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>确认添加产品</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="product-preview">
            <div class="preview-row">
              <span class="label">产品名称</span>
              <span class="value">${productData.name || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">品牌 | 类别</span>
              <span class="value">${productData.brand || '-'} | ${productData.category || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">价格</span>
              <span class="preview-price">¥${(productData.price || 0).toLocaleString()}</span>
            </div>
            <div class="preview-row">
              <span class="label">CPU</span>
              <span class="value">${productData.cpu || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">显卡</span>
              <span class="value">${productData.gpu || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">内存</span>
              <span class="value">${productData.ram || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">硬盘</span>
              <span class="value">${productData.storage || '-'}</span>
            </div>
            <div class="preview-row">
              <span class="label">屏幕</span>
              <span class="value">${productData.screen_size ? productData.screen_size + ' 英寸' : '-'}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modal-cancel">取消</button>
          <button class="btn btn-primary" id="modal-confirm">确认添加</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 关闭按钮
    overlay.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal(overlay);
    });

    overlay.querySelector('#modal-cancel').addEventListener('click', () => {
      this.closeModal(overlay);
    });

    overlay.querySelector('#modal-confirm').addEventListener('click', async () => {
      await this.confirmAddProduct(productData, overlay);
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeModal(overlay);
      }
    });
  }

  /**
   * 关闭弹窗
   */
  closeModal(overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 200);
  }

  /**
   * 确认添加产品
   */
  async confirmAddProduct(productData, overlay) {
    const confirmBtn = overlay.querySelector('#modal-confirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '添加中...';

    try {
      const result = await api.addProduct(productData);

      if (!result.success) {
        throw new Error(result.error || '添加失败');
      }

      this.showToast('产品添加成功！', 'success');
      this.closeModal(overlay);

      // 清空输入框
      const linkInput = document.getElementById('product-link-input');
      if (linkInput) linkInput.value = '';

      // 刷新数据
      await this.loadData();
      this.applyFilters();

    } catch (error) {
      console.error('Confirm add error:', error);
      this.showToast(error.message || '添加产品失败', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '确认添加';
    }
  }

  /**
   * 加载初始数据
   */
  async loadData() {
    try {
      const response = await api.getProducts();
      this.products = response.data || [];
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showToast('加载产品数据失败', 'error');
      this.products = [];
      this.filteredProducts = [];
    }
  }

  /**
   * 初始化各组件
   */
  initComponents() {
    // 品牌筛选
    const brandContainer = document.getElementById('brand-filter');
    if (brandContainer) {
      this.brandFilter = new BrandFilter({
        container: brandContainer,
        onChange: (brands) => this.applyFilters(),
      });
      this.brandFilter.init();
    }

    // 标签筛选
    const tagContainer = document.getElementById('tag-filter');
    if (tagContainer) {
      this.tagFilter = new TagFilter({
        container: tagContainer,
        onChange: () => this.applyFilters(),
      });
      this.tagFilter.init();
    }

    // 参数筛选
    const paramContainer = document.getElementById('param-filter');
    if (paramContainer) {
      this.paramFilter = new ParamFilter({
        container: paramContainer,
        onChange: () => this.applyFilters(),
      });
    }

    // 散点图
    const chartContainer = document.getElementById('scatter-chart');
    if (chartContainer) {
      this.scatterPlot = new ScatterPlot({
        container: chartContainer,
        onHover: (product, event) => this.handleHover(product, event),
        onClick: (product) => this.handleClick(product),
      });
      this.scatterPlot.init();
    }

    // 悬浮卡片
    this.productCard = new ProductCard();

    // 渲染初始数据
    this.render();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 卡片跟随鼠标
    document.addEventListener('mousemove', (e) => {
      if (this.productCard && this.productCard.visible) {
        this.productCard.move(e);
      }
    });
  }

  /**
   * 处理 hover
   */
  handleHover(product, event) {
    if (product) {
      this.productCard.show(product, event);
    } else {
      this.productCard.hide();
    }
  }

  /**
   * 处理点击 - 跳转详情页
   */
  handleClick(product) {
    window.location.href = `product.html?id=${product.id}`;
  }

  /**
   * 从CPU型号提取类型
   */
  extractCpuType(cpu) {
    if (!cpu) return 'Other';
    const upper = cpu.toUpperCase();
    if (upper.includes('INTEL') || upper.includes('CORE I')) return 'Intel';
    if (upper.includes('AMD') || upper.includes('RYZEN')) return 'AMD';
    if (upper.includes('APPLE') || upper.includes('M1') || upper.includes('M2') || upper.includes('M3')) return 'Apple';
    return 'Other';
  }

  /**
   * 应用筛选
   */
  applyFilters() {
    const selectedBrands = this.brandFilter ? this.brandFilter.getSelected() : [];
    const selectedTags = this.tagFilter ? this.tagFilter.getSelected() : [];
    const paramFilters = this.paramFilter ? this.paramFilter.getFilters() : {};

    this.filteredProducts = this.products.filter(product => {
      // 品牌筛选
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // 标签筛选（两个都选 = 全部）
      if (selectedTags.length > 0 && !selectedTags.includes(product.tag)) {
        return false;
      }

      // 参数筛选
      if (paramFilters.cpu_type) {
        const cpuType = this.extractCpuType(product.cpu);
        if (cpuType !== paramFilters.cpu_type) return false;
      }
      if (paramFilters.cpu && product.cpu !== paramFilters.cpu) return false;
      if (paramFilters.ram && product.ram !== paramFilters.ram) return false;
      if (paramFilters.storage && product.storage !== paramFilters.storage) return false;
      if (paramFilters.gpu && product.gpu !== paramFilters.gpu) return false;
      if (paramFilters.screen_size && product.screen_size.toString() !== paramFilters.screen_size) return false;

      return true;
    });

    this.render();
  }

  /**
   * 渲染组件
   */
  render() {
    // 更新参数筛选的可选项
    if (this.paramFilter) {
      this.paramFilter.extractOptionsFromProducts(this.products);
    }

    // 更新散点图
    if (this.scatterPlot) {
      this.scatterPlot.updateData(this.filteredProducts);
    }
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
