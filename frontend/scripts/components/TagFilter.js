/**
 * TagFilter.js - 产品标签筛选组件（游戏本 / 轻薄本）
 * 支持多选，两个都选 = 全部
 */

class TagFilter {
  constructor({ container, onChange }) {
    this.container = container;
    this.onChange = onChange;
    this.selectedTags = new Set();
    this.tags = ['游戏本', '轻薄本'];
  }

  /**
   * 初始化渲染
   */
  init() {
    this.render();
  }

  /**
   * 渲染标签按钮
   */
  render() {
    const html = `
      <div class="tag-buttons">
        ${this.tags.map(tag => `
          <button
            class="tag-btn ${this.selectedTags.has(tag) ? 'active' : ''}"
            data-tag="${tag}"
          >
            ${tag}
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
    const buttons = this.container.querySelectorAll('.tag-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        this.toggleTag(tag);
      });
    });
  }

  /**
   * 切换标签选中状态
   */
  toggleTag(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    const btn = this.container.querySelector(`[data-tag="${tag}"]`);
    if (btn) {
      btn.classList.toggle('active', this.selectedTags.has(tag));
    }
    if (this.onChange) {
      this.onChange(Array.from(this.selectedTags));
    }
  }

  /**
   * 获取选中的标签列表
   */
  getSelected() {
    return Array.from(this.selectedTags);
  }

  /**
   * 清空选择
   */
  clear() {
    this.selectedTags.clear();
    this.render();
    if (this.onChange) {
      this.onChange([]);
    }
  }
}

window.TagFilter = TagFilter;
