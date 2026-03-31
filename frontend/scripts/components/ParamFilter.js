/**
 * ParamFilter.js - 参数筛选组件
 * 所有筛选项都支持多选
 */

class ParamFilter {
  constructor({ container, onChange }) {
    this.container = container;
    this.onChange = onChange;
    this.filters = {
      cpu_type: [],
      cpu: [],
      ram: [],
      storage: [],
      gpu: [],
      screen_size: [],
      series: [],
    };
    this.availableOptions = {
      cpu_type: [],
      cpu: [],
      ram: [],
      storage: [],
      gpu: [],
      screen_size: [],
      series: [],
    };
  }

  /**
   * 从产品数据中提取可选参数值
   */
  extractOptionsFromProducts(products) {
    const options = {
      cpu: new Set(),
      ram: new Set(),
      storage: new Set(),
      gpu: new Set(),
      screen_size: new Set(),
      series: new Set(),
    };

    // CPU类型（从CPU型号中提取）
    const cpuTypes = new Set();

    products.forEach(p => {
      if (p.cpu) {
        options.cpu.add(p.cpu);
        const cpuType = this.extractCpuType(p.cpu);
        if (cpuType) cpuTypes.add(cpuType);
      }
      if (p.ram) options.ram.add(p.ram);
      if (p.storage) options.storage.add(p.storage);
      if (p.gpu) options.gpu.add(p.gpu);
      if (p.screen_size) options.screen_size.add(p.screen_size);
      if (p.series) options.series.add(p.series);
    });

    this.availableOptions = {
      cpu_type: Array.from(cpuTypes).sort(),
      cpu: Array.from(options.cpu).sort(),
      ram: this.sortRam(Array.from(options.ram)),
      storage: this.sortStorage(Array.from(options.storage)),
      gpu: Array.from(options.gpu).sort(),
      screen_size: Array.from(options.screen_size).map(v => parseFloat(v)).sort((a, b) => a - b).map(v => v.toString()),
      series: Array.from(options.series).sort(),
    };

    this.render();
  }

  /**
   * 从CPU型号提取类型
   */
  extractCpuType(cpu) {
    if (!cpu) return null;
    const lower = cpu.toLowerCase();
    
    if (lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('apple')) return 'Apple';
    if (lower.includes('ryzen') || lower.includes('r5 ') || lower.includes('r7 ') || lower.includes('r9 ') || 
        lower.startsWith('r5') || lower.startsWith('r7') || lower.startsWith('r9') ||
        lower.includes('amd') || lower.includes('radeon') || lower.includes('r ai')) return 'AMD';
    if (lower.includes('core i') || lower.includes('intel') || lower.includes('ultra') || 
        lower.includes('core 5') || lower.includes('core 7') || lower.includes('core 9') ||
        lower.startsWith('c5-') || lower.startsWith('c7-') || lower.startsWith('c9-')) return 'Intel';
    
    return 'Other';
  }

  /**
   * 内存排序
   */
  sortRam(ramList) {
    return ramList.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  }

  /**
   * 存储排序
   */
  sortStorage(storageList) {
    return storageList.sort((a, b) => {
      const numA = this.parseStorageSize(a);
      const numB = this.parseStorageSize(b);
      return numA - numB;
    });
  }

  /**
   * 解析存储大小为 GB 数值
   */
  parseStorageSize(str) {
    if (!str) return 0;
    const upper = str.toUpperCase();
    let num = parseInt(upper) || 0;
    if (upper.includes('TB')) num *= 1000;
    return num;
  }

  /**
   * 生成多选下拉HTML
   */
  createMultiSelectDropdown(param, label, options) {
    const triggerId = `${param}-trigger`;
    const panelId = `${param}-panel`;
    const checkboxesId = `${param}-checkboxes`;
    const textId = `${param}-text`;

    return `
      <div class="param-filter-group">
        <label>${label}</label>
        <div class="series-dropdown" id="${param}-dropdown">
          <button type="button" class="series-dropdown-trigger" id="${triggerId}">
            <span class="series-dropdown-text" id="${textId}">全部</span>
            <span class="series-dropdown-arrow">▼</span>
          </button>
          <div class="series-dropdown-panel" id="${panelId}" style="display:none;">
            <div class="series-dropdown-search">
              <input type="text" placeholder="搜索..." id="${param}-search">
            </div>
            <div class="series-dropdown-checkboxes" id="${checkboxesId}">
              ${options.map(opt => `
                <div class="series-checkbox-item" data-value="${this.escapeHtml(opt)}">
                  <span class="series-checkbox-box${this.filters[param].includes(opt) ? ' checked' : ''}" data-checkbox="${this.escapeHtml(opt)}"></span>
                  <span class="series-checkbox-text">${this.escapeHtml(opt)}</span>
                </div>
              `).join('')}
            </div>
            <div class="series-dropdown-footer">
              <button type="button" class="series-dropdown-close" id="${param}-close-btn">完成</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * HTML转义
   */
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * 渲染筛选下拉
   */
  render() {
    const html = `
      ${this.createMultiSelectDropdown('cpu_type', 'CPU类型', this.availableOptions.cpu_type)}
      ${this.createMultiSelectDropdown('cpu', 'CPU型号', this.availableOptions.cpu)}
      ${this.createMultiSelectDropdown('ram', '内存', this.availableOptions.ram)}
      ${this.createMultiSelectDropdown('storage', '硬盘', this.availableOptions.storage)}
      ${this.createMultiSelectDropdown('gpu', '显卡', this.availableOptions.gpu)}
      ${this.createMultiSelectDropdown('screen_size', '屏幕', this.availableOptions.screen_size)}
      ${this.createMultiSelectDropdown('series', '产品系列', this.availableOptions.series)}

      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" id="clear-filters">清空筛选</button>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  /**
   * 绑定事件
   */
  attachEvents() {
    const params = ['cpu_type', 'cpu', 'ram', 'storage', 'gpu', 'screen_size', 'series'];

    params.forEach(param => {
      const trigger = this.container.querySelector(`#${param}-trigger`);
      const panel = this.container.querySelector(`#${param}-panel`);
      const checkboxesContainer = this.container.querySelector(`#${param}-checkboxes`);
      const searchInput = this.container.querySelector(`#${param}-search`);
      const closeBtn = this.container.querySelector(`#${param}-close-btn`);

      if (!trigger || !panel) return;

      let panelOpen = false;

      const openPanel = (e) => {
        e.stopPropagation();
        e.preventDefault();
        panelOpen = true;
        panel.style.display = 'block';
        if (searchInput) searchInput.value = '';
        this.filterCheckboxes(param, '');
      };

      const closePanel = () => {
        panelOpen = false;
        panel.style.display = 'none';
      };

      trigger.addEventListener('click', openPanel);

      // 点击选项时切换选中状态
      checkboxesContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.series-checkbox-item');
        if (item) {
          const value = item.dataset.value;
          const box = item.querySelector('.series-checkbox-box');

          if (this.filters[param].includes(value)) {
            this.filters[param] = this.filters[param].filter(v => v !== value);
            box.classList.remove('checked');
          } else {
            this.filters[param].push(value);
            box.classList.add('checked');
          }

          this.updateDropdownText(param);
          this.notifyChange();
        }
      });

      // 阻止面板内的点击冒泡
      panel.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // 完成按钮关闭面板
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closePanel();
        });
      }

      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (panelOpen && !panel.contains(e.target) && e.target !== trigger) {
          closePanel();
        }
      });

      // 搜索过滤
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterCheckboxes(param, e.target.value);
        });
        searchInput.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      // 初始更新文字
      this.updateDropdownText(param);
    });

    const clearBtn = this.container.querySelector('#clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }
  }

  /**
   * 过滤复选框（搜索功能）
   */
  filterCheckboxes(param, searchText) {
    const checkboxes = this.container.querySelector(`#${param}-checkboxes`);
    if (!checkboxes) return;

    const items = checkboxes.querySelectorAll('.series-checkbox-item');
    const lowerSearch = searchText.toLowerCase();

    items.forEach(item => {
      const text = item.querySelector('.series-checkbox-text').textContent.toLowerCase();
      item.style.display = text.includes(lowerSearch) ? '' : 'none';
    });
  }

  /**
   * 更新下拉按钮文字
   */
  updateDropdownText(param) {
    const textEl = this.container.querySelector(`#${param}-text`);
    if (!textEl) return;

    const filters = this.filters[param];
    if (!filters || filters.length === 0) {
      textEl.textContent = '全部';
    } else if (filters.length === 1) {
      textEl.textContent = filters[0];
    } else {
      textEl.textContent = `已选 ${filters.length}`;
    }
  }

  /**
   * 通知变更
   */
  notifyChange() {
    if (this.onChange) {
      this.onChange({ ...this.filters });
    }
  }

  /**
   * 获取当前筛选值
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * 清空所有筛选
   */
  clear() {
    Object.keys(this.filters).forEach(key => {
      this.filters[key] = [];
    });
    this.render();
    this.notifyChange();
  }

  /**
   * 设置筛选值（外部调用）
   */
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    this.render();
  }
}

// 导出
window.ParamFilter = ParamFilter;
