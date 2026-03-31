/**
 * ParamFilter.js - 参数筛选组件
 * CPU / 内存 / 硬盘 / 显卡 / 屏幕尺寸 下拉筛选
 */

class ParamFilter {
  constructor({ container, onChange }) {
    this.container = container;
    this.onChange = onChange;
    this.filters = {
      cpu_type: '',
      cpu: '',
      ram: '',
      storage: '',
      gpu: '',
      screen_size: '',
      series: [],
    };
    this.availableOptions = {
      cpu_type: ['Intel', 'AMD', 'Apple'],
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
        // 从CPU型号提取类型
        const cpuType = this.extractCpuType(p.cpu);
        if (cpuType) cpuTypes.add(cpuType);
      }
      if (p.ram) options.ram.add(p.ram);
      if (p.storage) options.storage.add(p.storage);
      if (p.gpu) options.gpu.add(p.gpu);
      if (p.screen_size) options.screen_size.add(p.screen_size);
      if (p.series) options.series.add(p.series);
    });

    // 转换为排序后的数组
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
    const upper = cpu.toUpperCase();
    const lower = cpu.toLowerCase();
    
    // Apple Silicon
    if (lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('apple')) return 'Apple';
    
    // AMD: Ryzen系列, R5/R7/R9, Ryzen AI, R AI
    if (lower.includes('ryzen') || lower.includes('r5 ') || lower.includes('r7 ') || lower.includes('r9 ') || 
        lower.startsWith('r5') || lower.startsWith('r7') || lower.startsWith('r9') ||
        lower.includes('amd') || lower.includes('radeon') || lower.includes('r ai')) return 'AMD';
    
    // Intel: Core i系列, Ultra系列, Core 5/7/9系列, C5/C7/C9系列(赛扬)
    if (lower.includes('core i') || lower.includes('intel') || lower.includes('ultra') || 
        lower.includes('core 5') || lower.includes('core 7') || lower.includes('core 9') ||
        lower.startsWith('c5-') || lower.startsWith('c7-') || lower.startsWith('c9-') ||
        upper.includes('I5-') || upper.includes('I7-') || upper.includes('I9-')) return 'Intel';
    
    return 'Other';
  }

  /**
   * 内存排序（按 GB 数值）
   */
  sortRam(ramList) {
    return ramList.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  }

  /**
   * 存储排序（按 GB 数值）
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
    else if (upper.includes('GB')) num *= 1;
    return num;
  }

  /**
   * 渲染筛选下拉
   */
  render() {
    const html = `
      <div class="param-filter-group">
        <label>CPU类型</label>
        <select data-param="cpu_type">
          <option value="">全部</option>
          ${this.availableOptions.cpu_type.map(opt => `
            <option value="${opt}" ${this.filters.cpu_type === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group">
        <label>CPU型号</label>
        <select data-param="cpu">
          <option value="">全部</option>
          ${this.availableOptions.cpu.map(opt => `
            <option value="${opt}" ${this.filters.cpu === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group">
        <label>内存</label>
        <select data-param="ram">
          <option value="">全部</option>
          ${this.availableOptions.ram.map(opt => `
            <option value="${opt}" ${this.filters.ram === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group">
        <label>硬盘</label>
        <select data-param="storage">
          <option value="">全部</option>
          ${this.availableOptions.storage.map(opt => `
            <option value="${opt}" ${this.filters.storage === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group">
        <label>显卡</label>
        <select data-param="gpu">
          <option value="">全部</option>
          ${this.availableOptions.gpu.map(opt => `
            <option value="${opt}" ${this.filters.gpu === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group">
        <label>屏幕</label>
        <select data-param="screen_size">
          <option value="">全部</option>
          ${this.availableOptions.screen_size.map(opt => `
            <option value="${opt}" ${this.filters.screen_size === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>

      <div class="param-filter-group series-filter-group">
        <label>产品系列</label>
        <div class="series-dropdown" id="series-dropdown">
          <button type="button" class="series-dropdown-trigger" id="series-trigger">
            <span class="series-dropdown-text">全部</span>
            <span class="series-dropdown-arrow">▼</span>
          </button>
          <div class="series-dropdown-panel" id="series-panel" style="display:none;">
            <div class="series-dropdown-search">
              <input type="text" placeholder="搜索..." id="series-search">
            </div>
            <div class="series-dropdown-checkboxes" id="series-checkboxes">
              ${this.availableOptions.series.map(opt => `
                <div class="series-checkbox-item" data-value="${opt}">
                  <span class="series-checkbox-box${this.filters.series.includes(opt) ? ' checked' : ''}" data-checkbox="${opt}"></span>
                  <span class="series-checkbox-text">${opt}</span>
                </div>
              `).join('')}
            </div>
            <div class="series-dropdown-footer">
              <button type="button" class="series-dropdown-close" id="series-close-btn">完成</button>
            </div>
          </div>
        </div>
      </div>

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
    const selects = this.container.querySelectorAll('select[data-param]');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const param = e.target.dataset.param;
        if (param === 'series') {
          // 多选：获取所有选中项
          const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
          this.filters.series = selected;
        } else {
          this.filters[param] = e.target.value;
        }
        this.notifyChange();
      });
    });

    // 系列下拉多选事件
    const trigger = this.container.querySelector('#series-trigger');
    const panel = this.container.querySelector('#series-panel');
    const checkboxesContainer = this.container.querySelector('#series-checkboxes');

    if (trigger && panel) {
      let panelOpen = false;

      const openPanel = (e) => {
        e.stopPropagation();
        e.preventDefault();
        panelOpen = true;
        panel.style.display = 'block';
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

          // 切换选中状态
          if (this.filters.series.includes(value)) {
            this.filters.series = this.filters.series.filter(v => v !== value);
            box.classList.remove('checked');
          } else {
            this.filters.series.push(value);
            box.classList.add('checked');
          }

          this.updateSeriesDropdownText();
          this.notifyChange();
        }
      });

      // 阻止面板内的点击冒泡
      panel.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // 完成按钮关闭面板
      const closeBtn = this.container.querySelector('#series-close-btn');
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

      this.updateSeriesDropdownText();
    }

    const clearBtn = this.container.querySelector('#clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }
  }

  /**
   * 更新系列下拉按钮文字
   */
  updateSeriesDropdownText() {
    const textEl = this.container.querySelector('.series-dropdown-text');
    if (!textEl) return;
    if (this.filters.series.length === 0) {
      textEl.textContent = '全部';
    } else if (this.filters.series.length === 1) {
      textEl.textContent = this.filters.series[0];
    } else {
      textEl.textContent = `已选 ${this.filters.series.length}`;
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
      if (key === 'series') {
        this.filters[key] = [];
      } else {
        this.filters[key] = '';
      }
    });
    this.render();
    this.updateSeriesDropdownText();
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
