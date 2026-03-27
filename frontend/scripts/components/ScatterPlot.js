/**
 * ScatterPlot.js - ECharts 散点图组件
 * X 轴: performance_score（性能评分）
 * Y 轴: price（价格）
 * 散点: brand 着色
 */

class ScatterPlot {
  constructor({ container, onHover, onClick }) {
    this.container = container;
    this.onHover = onHover;   // hover 回调 (product, event) => {}
    this.onClick = onClick;   // click 回调 (product) => {}
    this.chart = null;
    this.products = [];
    this.brands = [];

    // 品牌颜色映射
    this.brandColors = {
      Apple: '#000000',
      Dell: '#007DB8',
      Lenovo: '#E2231A',
      HP: '#0096D6',
      ASUS: '#005B99',
      Acer: '#083866',
      Microsoft: '#00A4EF',
      Huawei: '#D42027',
      Xiaomi: '#FF6900',
      Razer: '#00FF00',
      MSI: '#E4002B',
      Gigabyte: '#00A651',
    };

    // 默认颜色池
    this.defaultColors = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#73c0de',
    ];
  }

  /**
   * 初始化图表
   */
  init() {
    // 确保容器有 ID
    if (!this.container.id) {
      this.container.id = 'scatter-chart-' + Date.now();
    }

    this.chart = echarts.init(this.container);
    this.bindChartEvents();
    this.renderEmpty();

    // 响应式
    window.addEventListener('resize', () => {
      this.chart && this.chart.resize();
    });
  }

  /**
   * 绑定图表事件
   */
  bindChartEvents() {
    this.chart.on('mouseover', (params) => {
      if (params.data && params.data._product) {
        this.onHover && this.onHover(params.data._product, params.event);
      }
    });

    this.chart.on('mouseout', () => {
      this.onHover && this.onHover(null);
    });

    this.chart.on('click', (params) => {
      if (params.data && params.data._product) {
        this.onClick && this.onClick(params.data._product);
      }
    });
  }

  /**
   * 渲染空状态
   */
  renderEmpty() {
    this.chart.setOption({
      title: {
        text: '暂无数据，请添加产品',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#64748b',
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [],
    });
  }

  /**
   * 更新数据并渲染
   * @param {Array} products - 产品列表
   */
  updateData(products) {
    this.products = products;
    this.brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

    if (!products.length) {
      this.renderEmpty();
      return;
    }

    // 计算每个series的最低价，用于X轴排序
    const seriesMinPrice = {};
    products.forEach(p => {
      const s = p.series || 'Other';
      if (!seriesMinPrice[s] || p.price < seriesMinPrice[s]) {
        seriesMinPrice[s] = p.price;
      }
    });

    // 按最低价排序series，得到X轴位置（从1开始）
    const sortedSeries = Object.entries(seriesMinPrice)
      .sort((a, b) => a[1] - b[1])
      .map(([s], i) => ({ series: s, x: i + 1 }));

    const seriesToX = {};
    sortedSeries.forEach(item => { seriesToX[item.series] = item.x; });

    // 按品牌分组，X用series位置
    const brandData = {};
    this.brands.forEach(brand => {
      brandData[brand] = [];
    });

    products.forEach(product => {
      const brand = product.brand || 'Other';
      if (!brandData[brand]) brandData[brand] = [];
      const x = seriesToX[product.series || 'Other'] || 0;
      brandData[brand].push({
        value: [x, product.price || 0],
        _product: product,
      });
    });

    // 是否显示标签（数据少时显示）
    const showLabels = products.length <= 15;
    // 标签配置
    const labelConfig = showLabels ? {
      show: true,
      position: 'right',
      distance: 8,
      fontSize: 11,
      color: '#475569',
      backgroundColor: 'rgba(255,255,255,0.85)',
      padding: [3, 6],
      borderRadius: 3,
      shadowBlur: 3,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      formatter: (params) => {
        const name = params.data._product?.name || '';
        // 名称超长时截断
        return name.length > 18 ? name.substring(0, 16) + '...' : name;
      },
    } : { show: false };

    // 构建系列
    const series = this.brands.map((brand, index) => {
      const color = this.getBrandColor(brand, index);
      return {
        name: brand,
        type: 'scatter',
        data: brandData[brand],
        symbolSize: 14,
        label: labelConfig,
        itemStyle: {
          color: color,
          opacity: 0.85,
          borderColor: 'rgba(255,255,255,0.8)',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
          scale: 1.4,
          label: {
            show: true,
            position: 'right',
            distance: 8,
            fontSize: 11,
            color: '#475569',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: [3, 6],
            borderRadius: 3,
          },
        },
      };
    });

    // 计算范围 - X轴是series顺序，Y轴是价格
    const xValues = products.map(p => seriesToX[p.series || 'Other'] || 0);
    const prices = products.map(p => p.price || 0);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);

    // 计算数据的实际跨度
    const priceRange = priceMax - priceMin;

    // X轴：series顺序，适度扩展
    let xAxisMin, xAxisMax;
    if (xValues.length === 1) {
      xAxisMin = Math.max(0, xMin - 1);
      xAxisMax = xMax + 1;
    } else {
      xAxisMin = Math.max(0, xMin - 1);
      xAxisMax = xMax + 1;
    }

    // 价格轴：根据数据分布动态调整
    let priceAxisMin, priceAxisMax;
    if (prices.length === 1) {
      // 只有一个点，上下各扩展50%
      priceAxisMin = Math.max(0, priceMin * 0.5);
      priceAxisMax = priceMax * 1.5;
    } else if (priceRange < 1000) {
      // 数据很集中（跨度<1000元），紧密包裹
      priceAxisMin = Math.floor(Math.max(0, priceMin - 500) / 500) * 500;
      priceAxisMax = Math.ceil((priceMax + 500) / 500) * 500;
    } else {
      // 正常情况，适度扩展
      priceAxisMin = Math.floor((priceMin - priceRange * 0.1) / 1000) * 1000;
      priceAxisMax = Math.ceil((priceMax + priceRange * 0.1) / 1000) * 1000;
    }

    // 确保最小范围，避免图表太空
    if (priceAxisMax - priceAxisMin < 1000 && prices.length > 1) {
      const center = (priceAxisMin + priceAxisMax) / 2;
      priceAxisMin = Math.floor((center - 500) / 500) * 500;
      priceAxisMax = Math.ceil((center + 500) / 500) * 500;
    }

    const option = {
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#1e293b',
          fontSize: 12,
        },
        formatter: (params) => {
          const p = params.data._product;
          if (!p) return '';
          return `<strong>${p.name}</strong><br/>
                  系列: ${p.series || '-'}<br/>
                  价格: ¥${(p.price || 0).toLocaleString()}`;
        },
      },
      legend: {
        show: true,
        type: 'scroll',
        right: 20,
        top: 20,
        pageTextStyle: {
          color: '#64748b',
        },
        textStyle: {
          color: '#64748b',
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 10,
      },
      grid: {
        left: 70,
        right: this.brands.length > 5 ? 180 : 100,
        top: 60,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        name: '产品系列(按最低价排序)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        min: xAxisMin,
        max: xAxisMax,
        axisLine: {
          lineStyle: { color: '#e2e8f0' },
        },
        axisTick: {
          lineStyle: { color: '#e2e8f0' },
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '价格 (元)',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        min: priceAxisMin,
        max: priceAxisMax,
        axisLine: {
          lineStyle: { color: '#e2e8f0' },
        },
        axisTick: {
          lineStyle: { color: '#e2e8f0' },
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (val) => {
            if (val >= 10000) return (val / 10000) + '万';
            return val;
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      series,
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
    };

    this.chart.setOption(option, true);
  }

  /**
   * 获取品牌颜色
   */
  getBrandColor(brand, index) {
    return this.brandColors[brand] || this.defaultColors[index % this.defaultColors.length];
  }

  /**
   * 销毁图表
   */
  dispose() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }
}

// 导出
window.ScatterPlot = ScatterPlot;
