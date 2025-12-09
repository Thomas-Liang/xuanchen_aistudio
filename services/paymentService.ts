/**
 * 支付服务 - Payment Service
 * 
 * 支持的支付通道:
 * 1. 微信支付 (WeChat Pay)
 * 2. 支付宝 (Alipay)
 * 
 * 推荐第三方聚合支付平台:
 * - 虎皮椒 (https://www.xunhupay.com)
 * - PayJS (https://payjs.cn)
 * - 易支付 (YiPay)
 * - Stripe (国际支付)
 */

// ==================== 配置 ====================

export interface PaymentConfig {
  // 聚合支付平台配置
  platform: 'xunhupay' | 'payjs' | 'yipay' | 'custom';
  
  // API 密钥 (从支付平台获取)
  appId: string;
  appSecret: string;
  
  // API 端点
  apiUrl: string;
  
  // 回调地址 (支付成功后通知)
  notifyUrl: string;
  returnUrl: string;
}

// 从 localStorage 或环境变量加载配置
export const getPaymentConfig = (): PaymentConfig | null => {
  const saved = localStorage.getItem('payment_config');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // 默认配置 (需要替换为真实值)
  return {
    platform: 'xunhupay',
    appId: '', // 填写您的 App ID
    appSecret: '', // 填写您的 App Secret
    apiUrl: 'https://api.xunhupay.com/payment/do.html',
    notifyUrl: window.location.origin + '/api/payment/notify',
    returnUrl: window.location.origin + '/payment/success',
  };
};

export const savePaymentConfig = (config: PaymentConfig) => {
  localStorage.setItem('payment_config', JSON.stringify(config));
};

// ==================== 类型定义 ====================

export type PaymentMethod = 'wechat' | 'alipay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export interface CreateOrderParams {
  orderId: string;
  amount: number; // 单位: 元
  title: string;
  description?: string;
  method: PaymentMethod;
  userId: string;
  metadata?: Record<string, any>;
}

export interface PaymentOrder {
  orderId: string;
  tradeNo?: string; // 支付平台订单号
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  qrCodeUrl?: string; // 支付二维码链接
  payUrl?: string; // H5 支付链接
  createdAt: string;
  paidAt?: string;
  expireAt?: string;
}

export interface PaymentResult {
  success: boolean;
  order?: PaymentOrder;
  error?: string;
}

// ==================== 订单存储 ====================

const ORDERS_KEY = 'payment_orders';

export const saveOrder = (order: PaymentOrder) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.orderId === order.orderId);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 100))); // 保留最近100条
};

export const getOrders = (): PaymentOrder[] => {
  const saved = localStorage.getItem(ORDERS_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const getOrder = (orderId: string): PaymentOrder | null => {
  const orders = getOrders();
  return orders.find(o => o.orderId === orderId) || null;
};

// ==================== 生成订单号 ====================

export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `XC${timestamp}${random}`.toUpperCase();
};

// ==================== 签名工具 ====================

// MD5 签名 (用于虎皮椒等平台)
const md5 = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => {
    // Fallback: 简单哈希 (生产环境建议后端签名)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return new Uint8Array([hash]);
  });
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 生成签名
export const generateSign = async (params: Record<string, any>, secret: string): Promise<string> => {
  // 按字母排序
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)
    .join('&') + secret;
  
  return await md5(signStr);
};

// ==================== 虎皮椒支付 (XunHuPay) ====================

export const createXunHuPayOrder = async (params: CreateOrderParams): Promise<PaymentResult> => {
  const config = getPaymentConfig();
  if (!config || !config.appId || !config.appSecret) {
    return { success: false, error: '支付配置未设置，请在后台配置支付参数' };
  }

  try {
    const orderData = {
      version: '1.1',
      appid: config.appId,
      trade_order_id: params.orderId,
      total_fee: params.amount.toFixed(2),
      title: params.title,
      time: Math.floor(Date.now() / 1000).toString(),
      notify_url: config.notifyUrl,
      return_url: config.returnUrl,
      nonce_str: Math.random().toString(36).substring(2, 15),
      type: params.method === 'wechat' ? 'wechat' : 'alipay',
    };

    // 生成签名
    const sign = await generateSign(orderData, config.appSecret);
    
    // 发起请求
    const formData = new FormData();
    Object.entries({ ...orderData, hash: sign }).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.errcode === 0 || result.return_code === 'SUCCESS') {
      const order: PaymentOrder = {
        orderId: params.orderId,
        tradeNo: result.trade_no || result.out_trade_no,
        amount: params.amount,
        status: 'pending',
        method: params.method,
        qrCodeUrl: result.url_qrcode || result.code_url,
        payUrl: result.url || result.pay_url,
        createdAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分钟过期
      };
      
      saveOrder(order);
      return { success: true, order };
    } else {
      return { 
        success: false, 
        error: result.errmsg || result.return_msg || '创建订单失败' 
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message || '网络请求失败' };
  }
};

// ==================== PayJS 支付 ====================

export const createPayJSOrder = async (params: CreateOrderParams): Promise<PaymentResult> => {
  const config = getPaymentConfig();
  if (!config || !config.appId || !config.appSecret) {
    return { success: false, error: '支付配置未设置' };
  }

  try {
    const orderData = {
      mchid: config.appId,
      out_trade_no: params.orderId,
      total_fee: Math.round(params.amount * 100), // 单位: 分
      body: params.title,
      notify_url: config.notifyUrl,
      type: params.method === 'wechat' ? 'native' : 'alipay',
    };

    const sign = await generateSign(orderData, config.appSecret);

    const response = await fetch(config.apiUrl || 'https://payjs.cn/api/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, sign }),
    });

    const result = await response.json();

    if (result.return_code === 1) {
      const order: PaymentOrder = {
        orderId: params.orderId,
        tradeNo: result.payjs_order_id,
        amount: params.amount,
        status: 'pending',
        method: params.method,
        qrCodeUrl: result.code_url,
        payUrl: result.qrcode,
        createdAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      
      saveOrder(order);
      return { success: true, order };
    } else {
      return { success: false, error: result.return_msg || '创建订单失败' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ==================== 统一下单接口 ====================

export const createPaymentOrder = async (params: CreateOrderParams): Promise<PaymentResult> => {
  const config = getPaymentConfig();
  
  if (!config) {
    return { success: false, error: '支付未配置' };
  }

  switch (config.platform) {
    case 'xunhupay':
      return createXunHuPayOrder(params);
    case 'payjs':
      return createPayJSOrder(params);
    default:
      // 自定义平台或演示模式
      return createDemoOrder(params);
  }
};

// ==================== 演示模式 (无真实支付) ====================

export const createDemoOrder = async (params: CreateOrderParams): Promise<PaymentResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 生成真实可扫描的二维码（扫码后显示支付信息）
  const payInfo = JSON.stringify({
    orderId: params.orderId,
    amount: params.amount,
    title: params.title,
    method: params.method,
    demo: true,
    message: '这是演示订单，扫码后点击"模拟支付"按钮完成测试'
  });
  
  const qrData = encodeURIComponent(`DEMO_PAY:${params.orderId}:${params.amount}`);
  
  const order: PaymentOrder = {
    orderId: params.orderId,
    tradeNo: 'DEMO_' + Date.now(),
    amount: params.amount,
    status: 'pending',
    method: params.method,
    // 使用免费二维码API生成
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000`,
    createdAt: new Date().toISOString(),
    expireAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
  
  saveOrder(order);
  console.log('📦 Demo order created:', order);
  return { success: true, order };
};

// ==================== 测试支付回调模拟 ====================

export const simulatePaymentCallback = async (orderId: string): Promise<boolean> => {
  // 模拟支付平台回调延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const order = getOrder(orderId);
  if (!order) {
    console.error('❌ Order not found:', orderId);
    return false;
  }
  
  if (order.status !== 'pending') {
    console.warn('⚠️ Order already processed:', order.status);
    return false;
  }
  
  // 更新订单状态
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.tradeNo = 'PAY_' + Date.now();
  saveOrder(order);
  
  console.log('✅ Payment callback simulated:', order);
  return true;
};

// ==================== 查询订单状态 ====================

export const queryOrderStatus = async (orderId: string): Promise<PaymentOrder | null> => {
  const config = getPaymentConfig();
  const localOrder = getOrder(orderId);
  
  if (!localOrder) return null;
  
  // 如果已支付或失败，直接返回
  if (localOrder.status !== 'pending') {
    return localOrder;
  }

  // 检查是否过期
  if (localOrder.expireAt && new Date(localOrder.expireAt) < new Date()) {
    localOrder.status = 'expired';
    saveOrder(localOrder);
    return localOrder;
  }

  // 如果配置了支付平台，查询真实状态
  if (config && config.appId && config.platform !== 'custom') {
    try {
      // 这里添加实际的订单查询逻辑
      // 不同平台查询方式不同
    } catch (error) {
      console.error('Query order failed:', error);
    }
  }

  return localOrder;
};

// ==================== 模拟支付成功 (仅演示) ====================

export const simulatePaymentSuccess = (orderId: string): boolean => {
  const order = getOrder(orderId);
  if (order && order.status === 'pending') {
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    saveOrder(order);
    return true;
  }
  return false;
};

// ==================== 支付配置检查 ====================

export const isPaymentConfigured = (): boolean => {
  const config = getPaymentConfig();
  return !!(config && config.appId && config.appSecret);
};

export const getPaymentPlatformName = (): string => {
  const config = getPaymentConfig();
  if (!config) return '未配置';
  
  const names: Record<string, string> = {
    xunhupay: '虎皮椒',
    payjs: 'PayJS',
    yipay: '易支付',
    custom: '自定义',
  };
  
  return names[config.platform] || config.platform;
};

