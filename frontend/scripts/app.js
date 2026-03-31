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
      this.paramFilter.extractOptionsFromProducts(this.products);
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
    // 已禁用 ProductCard，使用 scatterPlot 的 tooltip 显示完整信息
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
    const lower = cpu.toLowerCase();

    // Apple Silicon
    if (lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('apple')) return 'Apple';

    // AMD: Ryzen系列, R5/R7/R9, Ryzen AI, R AI
    if (lower.includes('ryzen') || lower.includes('r5 ') || lower.includes('r7 ') || lower.includes('r9 ') ||
        lower.startsWith('r5') || lower.startsWith('r7') || lower.startsWith('r9') ||
        lower.includes('amd') || lower.includes('radeon') || lower.includes('r ai')) return 'AMD';

    // Intel: Core i系列, Ultra系列, Core 5/7/9系列, C5/C7/C9系列(赛扬), I5/I7/I9
    if (lower.includes('core i') || lower.includes('intel') || lower.includes('ultra') ||
        lower.includes('core 5') || lower.includes('core 7') || lower.includes('core 9') ||
        lower.startsWith('c5-') || lower.startsWith('c7-') || lower.startsWith('c9-') ||
        upper.includes('I5-') || upper.includes('I7-') || upper.includes('I9-')) return 'Intel';

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

      // 参数筛选（现在都支持多选）
      if (paramFilters.cpu_type && paramFilters.cpu_type.length > 0) {
        const cpuType = this.extractCpuType(product.cpu);
        if (!paramFilters.cpu_type.includes(cpuType)) return false;
      }
      if (paramFilters.cpu && paramFilters.cpu.length > 0 && !paramFilters.cpu.includes(product.cpu)) return false;
      if (paramFilters.ram && paramFilters.ram.length > 0 && !paramFilters.ram.includes(product.ram)) return false;
      if (paramFilters.storage && paramFilters.storage.length > 0 && !paramFilters.storage.includes(product.storage)) return false;
      if (paramFilters.gpu && paramFilters.gpu.length > 0 && !paramFilters.gpu.includes(product.gpu)) return false;
      if (paramFilters.screen_size && paramFilters.screen_size.length > 0 && !paramFilters.screen_size.includes(product.screen_size?.toString())) return false;
      if (paramFilters.series && paramFilters.series.length > 0 && !paramFilters.series.includes(product.series)) return false;

      return true;
    });

    this.render();
  }

  /**
   * 渲染组件
   */
  render() {
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
