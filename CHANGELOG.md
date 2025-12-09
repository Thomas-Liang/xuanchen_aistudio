# XuanChen AI Studio 更新日志

## v2.0.0 - 2024年12月

---

## 🔑 重要信息速查

| 项目 | 值 |
|------|-----|
| **管理员邮箱** | `admin@xuanchen.ai` |
| **管理员密码** | `admin123` |
| **技术支持邮箱** | `support@xuanchen.ai` |

> ⚠️ 部署后请立即修改默认密码！

---

### 🎯 主要更新

本次更新新增了完整的**会员系统**、**付费功能**和**后台管理系统**，为产品商业化提供了完整的基础设施。

---

## 📦 新增功能模块

### 1. 会员登录系统

**文件**: `components/MemberLoginModal.tsx`

#### 功能特点
- ✅ 登录/注册双标签切换
- ✅ 邮箱 + 密码验证
- ✅ 密码显示/隐藏切换
- ✅ 演示账户快捷填入
- ✅ 错误提示中英双语
- ✅ 响应式设计（手机端从底部滑入）

#### 默认管理员账户
```
邮箱: admin@xuanchen.ai
密码: admin123
```

---

### 2. 会员中心

**文件**: `components/MemberDashboard.tsx`

#### 功能模块
| 标签页 | 功能 |
|--------|------|
| 资料 | 头像、用户名、邮箱、角色徽章、积分余额、注册时间 |
| 套餐 | 四档套餐卡片展示，支持一键订阅升级 |
| 记录 | 订单记录、使用记录追踪 |

#### 界面特点
- 积分进度条实时显示
- 管理员快捷入口（红色盾牌）
- 充值快捷跳转
- 退出登录功能

---

### 3. 后台管理系统

**文件**: `components/AdminPanel.tsx`

#### 功能模块

| 模块 | 功能说明 |
|------|----------|
| **概览** | 总用户数、总收入、总生成数、今日新增用户、今日收入、最近活动日志 |
| **用户管理** | 搜索用户、按套餐筛选、编辑用户信息、修改角色/套餐/积分、启用/禁用账户、删除用户 |
| **订单管理** | 查看所有支付记录、订单状态、支付金额、支付方式、时间戳 |
| **系统设置** | 新用户默认积分、每次生成消耗积分、开放注册开关 |

#### 用户角色
| 角色 | 标识 | 权限 |
|------|------|------|
| Admin | 🔴 红色盾牌 | 后台管理、无限积分 |
| VIP | 🟡 金色皇冠 | 高级功能 |
| User | ⚪ 灰色图标 | 基础功能 |

---

### 4. 充值中心

**文件**: `components/RechargeModal.tsx`

#### 订阅套餐

| 套餐 | 月费 | 年费 | 积分/月 | 特点 |
|------|------|------|---------|------|
| Free | ¥0 | ¥0 | 10 | 基础模型、标准分辨率、社区支持 |
| Basic | ¥9.9 | ¥99 | 100 | 全部模型、高清分辨率、邮件支持 |
| **Pro** ⭐ | ¥29.9 | ¥299 | 500 | 4K分辨率、优先支持、API访问 |
| Enterprise | ¥99.9 | ¥999 | 2000 | 全部功能、自定义模型、专属客服、白标定制 |

#### 积分充值包

| 积分包 | 价格 | 赠送 | 总计 | 单价 |
|--------|------|------|------|------|
| 小包 | ¥4.9 | 0 | 50 | ¥0.098/次 |
| **中包** ⭐ | ¥18 | +20 | 220 | ¥0.082/次 |
| 大包 | ¥39 | +60 | 560 | ¥0.070/次 |
| 超值包 | ¥68 | +150 | 1150 | ¥0.059/次 |

#### 支付方式
- 💚 微信支付（扫码）
- 🔵 支付宝（扫码）
- 💜 银行卡

---

### 5. GitHub 同步功能

**文件**: `components/GitHubSyncModal.tsx`, `services/githubService.ts`, `utils/fileSystem.ts`

#### 功能模式

**手动模式**
1. 输入 GitHub Token 连接
2. 选择目标仓库和分支
3. 选择本地项目文件夹
4. 查看文件变更对比（NEW/MOD）
5. 输入 commit message
6. 一键推送

**自动机器人模式**
- 设置监控间隔（5秒 ~ 1小时）
- 自动检测文件变化
- 自动推送到 GitHub
- 活动日志实时显示

#### 核心功能
- ✅ 创建新仓库（公开/私有）
- ✅ 自动获取仓库列表和分支
- ✅ 智能文件对比（Git SHA 哈希）
- ✅ 自动忽略 `node_modules`, `.git`, `dist`, `build`, `.next`
- ✅ 记住上次选择的文件夹（IndexedDB 持久化）

---

## 🔧 技术架构更新

### 新增类型定义

**文件**: `types.ts`

```typescript
// 会员角色
type MemberRole = 'user' | 'vip' | 'admin';

// 套餐类型
type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

// 会员信息
interface Member {
  id: string;
  email: string;
  username: string;
  password: string;
  avatar?: string;
  role: MemberRole;
  plan: PlanType;
  credits: number;
  totalCredits: number;
  createdAt: string;
  lastLoginAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// 套餐配置
interface Plan {
  id: PlanType;
  name: string;
  nameZh: string;
  price: number;
  priceYearly: number;
  credits: number;
  features: string[];
  featuresZh: string[];
  popular?: boolean;
}

// 支付记录
interface PaymentRecord {
  id: string;
  memberId: string;
  plan: PlanType;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  method: 'wechat' | 'alipay' | 'card' | 'other';
}

// 使用记录
interface UsageRecord {
  id: string;
  memberId: string;
  type: 'generation' | 'edit' | 'upscale';
  creditsUsed: number;
  prompt?: string;
  model?: string;
  createdAt: string;
}

// 管理统计
interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalGenerations: number;
  newUsersToday: number;
  revenueToday: number;
}
```

### AuthContext 更新

**文件**: `contexts/AuthContext.tsx`

新增方法：
| 方法 | 说明 |
|------|------|
| `memberLogin(email, password)` | 会员登录 |
| `memberRegister(email, username, password)` | 会员注册 |
| `memberLogout()` | 会员登出 |
| `updateMember(id, updates)` | 更新会员信息 |
| `deleteMember(id)` | 删除会员 |
| `useCredits(amount)` | 消耗积分 |
| `upgradePlan(plan)` | 升级套餐 |
| `addPayment(payment)` | 添加支付记录 |
| `addUsageRecord(record)` | 添加使用记录 |
| `getAdminStats()` | 获取管理统计 |

新增状态：
| 状态 | 说明 |
|------|------|
| `currentMember` | 当前登录会员 |
| `members` | 所有会员列表 |
| `payments` | 支付记录 |
| `usageRecords` | 使用记录 |
| `isAdmin` | 是否管理员 |

---

## 🎨 UI/UX 更新

### 响应式设计
- 全面支持手机、平板、桌面端
- 顶部按钮自动适配尺寸
- 弹窗在手机端从底部滑入
- 触摸体验优化

### 主题系统
- 山葵青 (Sage)
- 深海蓝 (Ocean)
- 绯红 (Crimson)
- 琥珀 (Amber)

### 顶部导航栏更新
| 按钮 | 功能 |
|------|------|
| ⚡ 充值 | 打开充值中心（登录后）/ 打开支持页面（未登录） |
| 🎨 主题 | 切换配色主题 |
| 🌐 语言 | 中/英切换 |
| 📖 文档 | 使用说明 |
| 👤 登录 | 会员登录（未登录时显示） |
| 🔵 头像 | 会员中心（登录后显示积分） |
| 🔴 管理 | 后台管理（仅管理员可见） |
| ⚙️ 账户 | 站点设置 |
| 🐙 GitHub | GitHub 同步 |
| 🔒 锁定 | 锁定工作室 |

---

## 📝 文档更新

### 使用说明文档
**文件**: `components/DocsModal.tsx`

新增章节：
1. GitHub 同步
2. 主题系统
3. 响应式设计
4. 会员系统

### 多语言支持
**文件**: `contexts/LanguageContext.tsx`

新增翻译键值：
- `docs.github_sync` / `docs.github_sync_desc`
- `docs.github_manual` / `docs.github_manual_desc`
- `docs.github_bot` / `docs.github_bot_desc`
- `docs.github_features` / `docs.github_feature_1~5`
- `docs.github_token` / `docs.github_token_desc`
- `docs.theme_system` / `docs.theme_desc`
- `docs.responsive` / `docs.responsive_desc`
- `docs.member_system` / `docs.member_desc`
- `docs.member_plans` / `docs.member_plans_desc`
- `docs.member_admin` / `docs.member_admin_desc`

---

## 📁 文件结构

```
nanobanana-studio-v5/
├── App.tsx                          # 主应用（已更新）
├── types.ts                         # 类型定义（已更新）
├── CHANGELOG.md                     # 更新日志（新增）
├── components/
│   ├── MemberLoginModal.tsx         # 会员登录（新增）
│   ├── MemberDashboard.tsx          # 会员中心（新增）
│   ├── AdminPanel.tsx               # 后台管理（新增）
│   ├── RechargeModal.tsx            # 充值中心（新增）
│   ├── GitHubSyncModal.tsx          # GitHub同步（新增）
│   ├── DocsModal.tsx                # 使用说明（已更新）
│   └── ...
├── contexts/
│   ├── AuthContext.tsx              # 认证上下文（已更新）
│   ├── LanguageContext.tsx          # 语言上下文（已更新）
│   └── ThemeContext.tsx             # 主题上下文
├── services/
│   ├── apiService.ts                # API 服务
│   └── githubService.ts             # GitHub 服务（新增）
└── utils/
    └── fileSystem.ts                # 文件系统工具（新增）
```

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 默认管理员账户
| 项目 | 值 |
|------|-----|
| 邮箱 | `admin@xuanchen.ai` |
| 密码 | `admin123` |
| 权限 | 后台管理、无限积分 |

> ⚠️ **安全提示**: 部署后请立即修改默认密码！

### 技术支持
| 项目 | 值 |
|------|-----|
| 支持邮箱 | `support@xuanchen.ai` |

---

## 💳 真实支付集成

### 支持的支付平台

| 平台 | 说明 | 官网 |
|------|------|------|
| **虎皮椒** | 个人免签约，支持微信/支付宝 | https://www.xunhupay.com |
| **PayJS** | 个人收款，费率低 | https://payjs.cn |
| **易支付** | 自建易支付系统 | - |
| **自定义** | 自定义支付接口 | - |

### 配置步骤

1. 在支付平台注册账号并完成实名认证
2. 获取 `App ID` 和 `App Secret`
3. 登录管理员账户
4. 点击充值页面的"配置"按钮
5. 选择支付平台并填写密钥
6. 设置回调地址（Notify URL / Return URL）
7. 保存配置

### 新增文件

| 文件 | 说明 |
|------|------|
| `services/paymentService.ts` | 支付服务核心逻辑 |
| `components/PaymentSettings.tsx` | 支付配置界面 |

### 支付流程

```
选择商品 → 选择支付方式 → 创建订单 → 显示支付二维码 → 轮询支付状态 → 支付成功 → 发放积分
```

---

## 📌 注意事项

1. **数据存储**: 当前版本使用 `localStorage` 存储数据，适合演示和小规模使用。生产环境建议接入后端数据库。

2. **支付安全**: 密钥存储在前端 `localStorage` 中，生产环境建议：
   - 将支付逻辑移至后端
   - 使用环境变量存储密钥
   - 添加签名验证

3. **GitHub Token**: 使用 GitHub 同步功能需要 Personal Access Token，需具有 `repo` 权限。

4. **浏览器支持**: GitHub 同步的自动模式需要 Chrome/Edge 浏览器支持 File System Access API。

---

## 🔮 后续规划

- [ ] 后端 API 集成
- [ ] 邮箱验证 / 手机验证
- [ ] 忘记密码功能
- [ ] 邀请码系统
- [ ] 积分兑换码
- [ ] 数据导出功能
- [ ] 更多统计图表

---

## 💳 支付功能完善指南

### 第一阶段：基础配置（当前已完成）

#### ✅ 已实现
- [x] 虎皮椒/PayJS 支付接入
- [x] 微信/支付宝扫码支付
- [x] 订单创建与管理
- [x] 支付状态轮询
- [x] 支付配置界面

#### 📝 立即可用步骤
1. 注册虎皮椒账号：https://www.xunhupay.com
2. 完成实名认证（约1-2天）
3. 获取 App ID 和 App Secret
4. 在后台填写配置
5. 测试支付流程

---

### 第二阶段：后端集成（推荐）

#### 为什么需要后端？
- 🔐 密钥安全：前端存储密钥有泄露风险
- ✅ 签名验证：支付回调需要服务端验签
- 📊 数据持久化：localStorage 数据易丢失
- 🔄 异步通知：支付平台回调需要服务端接收

#### 推荐技术栈
```
前端: React (当前)
后端: Node.js + Express / Nest.js
数据库: MySQL / PostgreSQL / MongoDB
缓存: Redis (订单状态缓存)
```

#### 后端 API 设计

```typescript
// 1. 创建订单
POST /api/payment/create
Request: { amount, productType, productId, payMethod }
Response: { orderId, qrCodeUrl, expireAt }

// 2. 查询订单状态
GET /api/payment/status/:orderId
Response: { orderId, status, paidAt }

// 3. 支付回调（支付平台调用）
POST /api/payment/notify
Request: { 支付平台回调参数 }
Response: "success"

// 4. 订单列表
GET /api/payment/orders?page=1&limit=10
Response: { orders: [...], total }
```

#### 数据库表设计

```sql
-- 订单表
CREATE TABLE orders (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  product_type ENUM('plan', 'credits') NOT NULL,
  product_id VARCHAR(32),
  pay_method ENUM('wechat', 'alipay') NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  trade_no VARCHAR(64),
  qr_code_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  expire_at TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);

-- 支付回调日志
CREATE TABLE payment_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32),
  platform VARCHAR(32),
  raw_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 第三阶段：安全加固

#### 1. 签名验证
```typescript
// 后端验签示例
const verifySign = (params: Record<string, any>, secret: string) => {
  const { sign, ...rest } = params;
  const sortedStr = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&') + secret;
  return md5(sortedStr) === sign;
};
```

#### 2. 防重放攻击
```typescript
// 使用 Redis 记录已处理的通知
const processNotify = async (orderId: string, tradeNo: string) => {
  const key = `payment:notify:${orderId}:${tradeNo}`;
  const exists = await redis.get(key);
  if (exists) return; // 已处理
  
  await redis.setex(key, 86400, '1'); // 24小时过期
  // 处理业务逻辑...
};
```

#### 3. 金额校验
```typescript
// 回调时校验金额
const verifyAmount = (orderId: string, paidAmount: number) => {
  const order = await db.orders.findById(orderId);
  if (Math.abs(order.amount - paidAmount) > 0.01) {
    throw new Error('金额不匹配');
  }
};
```

#### 4. IP 白名单
```typescript
// 只允许支付平台 IP 回调
const WHITELIST_IPS = [
  '47.92.132.2',   // 虎皮椒
  '47.92.132.3',
  // ...
];

app.post('/api/payment/notify', (req, res) => {
  const clientIp = req.ip;
  if (!WHITELIST_IPS.includes(clientIp)) {
    return res.status(403).send('Forbidden');
  }
  // ...
});
```

---

### 第四阶段：功能扩展

#### 1. 退款功能
```typescript
POST /api/payment/refund
Request: { orderId, reason }
Response: { refundId, status }
```

#### 2. 优惠券系统
```sql
CREATE TABLE coupons (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  type ENUM('fixed', 'percent') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. 发票功能
```typescript
POST /api/invoice/apply
Request: { orderId, type, title, taxNo }
Response: { invoiceId, status }
```

#### 4. 自动续费
```typescript
// 定时任务检查即将到期的订阅
const checkExpiring = async () => {
  const users = await db.users.find({
    plan_expire_at: { $lt: new Date(Date.now() + 3 * 24 * 3600 * 1000) }
  });
  
  for (const user of users) {
    if (user.auto_renew) {
      await createRenewalOrder(user);
    } else {
      await sendExpiringNotice(user);
    }
  }
};
```

---

### 第五阶段：监控与运维

#### 1. 支付监控指标
- 订单创建成功率
- 支付成功率
- 平均支付时长
- 退款率

#### 2. 告警配置
```typescript
// 支付异常告警
if (failureRate > 0.1) {
  await sendAlert({
    channel: 'dingtalk',
    message: `支付失败率异常: ${failureRate * 100}%`
  });
}
```

#### 3. 对账功能
```typescript
// 每日对账任务
const dailyReconciliation = async () => {
  const localOrders = await db.orders.find({ 
    status: 'paid',
    paid_at: { $gte: yesterday, $lt: today }
  });
  
  const platformOrders = await paymentPlatform.queryOrders({
    start_date: yesterday,
    end_date: today
  });
  
  // 比对差异...
};
```

---

### 推荐第三方服务

| 服务 | 用途 | 推荐 |
|------|------|------|
| **虎皮椒** | 个人支付聚合 | ⭐⭐⭐⭐⭐ |
| **PayJS** | 个人微信收款 | ⭐⭐⭐⭐ |
| **Stripe** | 国际支付 | ⭐⭐⭐⭐⭐ |
| **Paddle** | SaaS 订阅 | ⭐⭐⭐⭐ |
| **LemonSqueezy** | 数字产品销售 | ⭐⭐⭐⭐ |

---

### 快速上线清单

#### 最小可用版本 (MVP)
- [x] 选择支付平台（推荐虎皮椒）
- [x] 注册并实名认证
- [x] 配置 App ID / Secret
- [x] 测试支付流程
- [ ] 配置 HTTPS（必须）
- [ ] 设置回调域名

#### 生产环境
- [ ] 部署后端服务
- [ ] 配置数据库
- [ ] 实现签名验证
- [ ] 添加支付日志
- [ ] 设置监控告警
- [ ] 配置 IP 白名单

---

### 常见问题

**Q: 没有营业执照能收款吗？**
A: 可以，虎皮椒/PayJS 支持个人收款。

**Q: 费率是多少？**
A: 虎皮椒约 1%，PayJS 约 1%，具体以平台为准。

**Q: 提现多久到账？**
A: 一般 T+1 到账，部分平台支持即时提现。

**Q: 需要备案吗？**
A: 回调地址需要是已备案域名。

**Q: 支持境外支付吗？**
A: 微信/支付宝支持境外用户扫码，但提现仅限境内账户。

---

*最后更新: 2024年12月*

