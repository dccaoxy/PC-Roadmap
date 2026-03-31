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
   * 生成系列简称
   */
  getSeriesAbbr(seriesName) {
    if (!seriesName || seriesName === 'Other') return '-';
    // 规则：
    // 1. 去除品牌前缀（假设品牌名已在系列名中重复）
    // 2. 常见系列缩写
    const abbrMap = {
      'OMEN 16': 'OMEN',
      'OMEN 17': 'OMEN',
      'ENVY x360': 'ENVY x360',
      'Pavilion Plus': 'Pav+',
      'Pavilion Aero': 'Pav Aero',
      'Pavilion Gaming': 'Pav Gm',
      'OmniBook 3': 'OB3',
      'OmniBook 5': 'OB5',
      'OmniBook 7': 'OB7',
      'OmniBook Ultra': 'OB Ultra',
      'OmniBook Flip': 'OB Flip',
      'Victus 15': 'Victus 15',
      'Victus 16': 'Victus 16',
      'Spectre x360': 'Sp x360',
      'Envy x360': 'ENVY x360',
      'P14 Pro': 'P14 Pro',
      'P16 Pro': 'P16 Pro',
      'P16s': 'P16s',
      'P14s': 'P14s',
      'T14': 'T14',
      'T14s': 'T14s',
      'T16': 'T16',
      'X1 Carbon': 'X1 C',
      'X1 Yoga': 'X1 Y',
      'ThinkBook 14': 'TB14',
      'ThinkBook 15': 'TB15',
      'ThinkBook 16': 'TB16',
      'IdeaPad 5': 'IP5',
      'IdeaPad 5 Pro': 'IP5 Pro',
      'IdeaPad Gaming': 'IP Gm',
      'Legion 5': 'Leg5',
      'Legion 5 Pro': 'Leg5 Pro',
      'Legion 7': 'Leg7',
      'Legion 9': 'Leg9',
      'Yoga 6': 'Yoga6',
      'Yoga 7': 'Yoga7',
      'Yoga 9': 'Yoga9',
      'Yoga Air': 'Yoga Air',
      'Swift 3': 'Sw3',
      'Swift 5': 'Sw5',
      'Aspire 5': 'Asp5',
      'Aspire 7': 'Asp7',
      'Predator': 'Pred',
      'Nitro 5': 'Nitro5',
      'Nitro 7': 'Nitro7',
    };
    if (abbrMap[seriesName]) return abbrMap[seriesName];

    // 通用缩写规则
    let abbr = seriesName
      .replace(/HP\s*/gi, '')
      .replace(/Dell\s*/gi, '')
      .replace(/Lenovo\s*/gi, '')
      .replace(/ASUS\s*/gi, '')
      .replace(/Acer\s*/gi, '')
      .replace(/Microsoft\s*/gi, '')
      .replace(/Apple\s*/gi, '')
      .replace(/Huawei\s*/gi, '')
      .replace(/Xiaomi\s*/gi, '')
      .replace(/Razer\s*/gi, '')
      .replace(/MSI\s*/gi, '')
      .replace(/Gigabyte\s*/gi, '');

    // 进一步缩短
    if (abbr.length > 10) {
      abbr = abbr
        .replace(/OmniBook/gi, 'OB')
        .replace(/Pavilion/gi, 'Pav')
        .replace(/IdeaPad/gi, 'IP')
        .replace(/ThinkPad/gi, 'TP')
        .replace(/ThinkBook/gi, 'TB')
        .replace(/Legion/gi, 'Leg')
        .replace(/Victus/gi, 'Vic')
        .replace(/Inspiron/gi, 'Ins')
        .replace(/Latitude/gi, 'Lat')
        .replace(/Precision/gi, 'Pre')
        .replace(/Swift/gi, 'Sw')
        .replace(/Aspire/gi, 'Asp')
        .replace(/Predator/gi, 'Pred')
        .replace(/Nitro/gi, 'Nit')
        .replace(/Surface/gi, 'Sf')
        .replace(/Yoga/gi, 'Yg')
        .replace(/Spectre/gi, 'Sp')
        .replace(/Envy/gi, 'En')
        .replace(/ProBook/gi, 'PB')
        .replace(/EliteBook/gi, 'EB')
        .replace(/Book/gi, 'Bk');
    }

    return abbr.trim() || seriesName;
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
      .map(([s], i) => ({ series: s, x: i + 1, abbr: this.getSeriesAbbr(s) }));

    const seriesToX = {};
    sortedSeries.forEach(item => { seriesToX[item.series] = item.x; });

    // X轴标签：位置到(全称,简称)的映射
    const xLabelMap = {};
    sortedSeries.forEach(item => {
      xLabelMap[item.x] = { name: item.series, abbr: item.abbr };
    });

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
    // 标签配置 - 关闭，使用 tooltip 显示完整信息
    const labelConfig = { show: false };

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
            show: false,  // 关闭额外的悬浮标签，使用 tooltip 显示完整信息
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
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#f8fafc',
          fontSize: 12,
        },
        extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 320px;',
        formatter: (params) => {
          const p = params.data._product;
          if (!p) return '';
          
          const cpu = p.cpu || '-';
          const gpu = p.gpu || '-';
          const ram = p.ram || '-';
          const storage = p.storage || '-';
          const screen = p.screen_size ? p.screen_size + '英寸' : '-';
          
          return `
            <div style="font-size:13px; line-height:1.6;">
              <div style="font-weight:600; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #475569;">
                ${p.name}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">系列:</span> ${p.series || '-'}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">价格:</span> 
                <span style="color:#fbbf24; font-weight:600;">¥${(p.price || 0).toLocaleString()}</span>
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">CPU:</span> ${cpu}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">显卡:</span> ${gpu}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">内存:</span> ${ram}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">硬盘:</span> ${storage}
              </div>
              <div style="margin:4px 0;">
                <span style="color:#94a3b8;">屏幕:</span> ${screen}
              </div>
            </div>
          `;
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
        bottom: 120,
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
          alignWithLabel: true,
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          interval: 0,
          rotate: -90,
          margin: 12,
          formatter: (value) => {
            const info = xLabelMap[value];
            if (!info) return '';
            return info.abbr || info.name;
          },
          overflow: 'truncate',
          width: 60,
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
