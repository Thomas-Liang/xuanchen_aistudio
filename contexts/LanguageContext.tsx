import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // App General
    'app.title': 'XuanChen AI Studio',
    'app.description': 'XuanChen AI Studio is a specialized interface for Gemini-based image generation and editing models, featuring aspect ratio control, high-definition support, and multi-reference image inputs.',
    'app.usage_guide': 'User Guide',
    'app.prompt_placeholder': 'Describe your imagination...',
    'app.prompt_label': 'Creative Prompt',
    'app.reference_label': 'Reference Images (Optional)',
    'app.generate_btn': 'Generate Artwork',
    'app.generating': 'Generating...',
    'app.download': 'Download',
    'app.output_title': 'Output',
    'app.processing': 'Processing pixels...',
    'app.waiting_msg': 'Your creation will appear here.\nConfigure settings and click Generate.',
    'app.error_prompt': 'Please enter a prompt description.',
    'app.error_api': 'API Key is missing.',
    'app.login_btn': 'Login',
    'app.logout_btn': 'Lock Studio',
    'app.payment_btn': 'Upgrade / Support',
    'app.account_btn': 'Account',
    'app.theme_btn': 'Theme',
    
    // Themes
    'theme.sage': 'Sage',
    'theme.ocean': 'Ocean',
    'theme.crimson': 'Crimson',
    'theme.amber': 'Amber',

    // Control Panel
    'controls.title': 'Controls',
    'controls.active_model': 'Active Model',
    'controls.aspect_ratio': 'Aspect Ratio',
    'controls.resolution': 'Output Resolution',
    'controls.configure_btn': 'Configure API & Model',
    
    // File Upload
    'upload.drop_text': 'Drop reference images here',
    'upload.click_text': 'or click to upload (Supports multiple images)',
    
    // Settings Modal
    'settings.title': 'API Settings',
    'settings.subtitle': 'Customize Gemini Interface Parameters & Models',
    'settings.apikey_label': 'API Key (Custom)',
    'settings.apikey_placeholder': 'sk-...',
    'settings.apikey_help': 'Leave empty to use the system environment key (process.env.API_KEY)',
    'settings.baseurl_label': 'API Base URL',
    'settings.provider_google': 'Google Official',
    'settings.provider_openrouter': 'OpenRouter',
    'settings.provider_custom': 'Custom',
    'settings.model_label': 'Model Name',
    'settings.model_custom': 'Custom',
    'settings.custom_placeholder': 'Enter Model ID',
    'settings.payment_config': 'Payment Configuration',
    'settings.qr_upload_label': 'Upload Collection QR Code',
    'settings.qr_upload_btn': 'Select Image',
    'settings.qr_upload_help': 'Upload your WeChat/Alipay QR code. Users will see this when clicking "Support".',
    'settings.security_title': 'Security Settings',
    'settings.change_password': 'Change Access Password',
    'settings.new_password_placeholder': 'New Password',
    'settings.update_btn': 'Update Password',
    'settings.password_saved': 'Password updated successfully',
    'settings.cancel': 'Cancel',
    'settings.save': 'Save Configuration',

    // Account Modal
    'account.title': 'Account & Security',
    'account.subtitle': 'Manage your access password and payment settings',

    // Auth & Payment
    'auth.title': 'Welcome Back',
    'auth.password_label': 'Access Password',
    'auth.password_placeholder': 'Enter password to unlock',
    'auth.enter': 'Enter Studio',
    'payment.title': 'Support XuanChen AI',
    'payment.subtitle': 'Scan the QR code below to subscribe or support development.',
    'payment.no_qr': 'No payment QR code configured.',

    // Docs Modal
    'docs.title': 'User Guide',
    'docs.subtitle': 'XuanChen AI Studio Operation Manual',
    'docs.core_features': 'Core Features',
    'docs.core_desc': 'XuanChen AI Studio is a specialized image generation interface based on Gemini architecture. It focuses on a minimal experience, supporting multimodal input (Text + Image), precise aspect ratio control, and HD output options.',
    'docs.api_config': 'API Configuration',
    'docs.api_key': 'API Key',
    'docs.api_key_desc': 'Please enter your API Key in settings. If left empty, the system will attempt to use the default Key bound in the environment.',
    'docs.base_url': 'Base URL',
    'docs.base_url_google': 'Google Official: Connects to native Google servers (googleapis.com).',
    'docs.base_url_openrouter': 'OpenRouter: Connects to OpenRouter aggregator.',
    'docs.base_url_custom': 'Custom: Defaults to XuanChen accelerated node (ai.t8star.cn).',
    'docs.model_strategy': 'Model Selection Strategy',
    'docs.model_banana_fast': 'Lightweight model for rapid iteration. (No Official API support)',
    'docs.model_banana_pro': 'Enhanced model for better semantics. (No Official API support)',
    'docs.model_google': 'Google official latest vision model. Requires "Google Official" Base URL.',
    'docs.img_ref': 'Image Reference & Editing',
    'docs.img_ref_desc': 'You can drag or click to upload images as reference.',
    'docs.img_ref_note': 'Note: When uploading images, the system automatically switches to the Image-to-Image endpoint (/edits). Ensure your selected model supports image input.',
    'docs.github_sync': 'GitHub Sync',
    'docs.github_sync_desc': 'Built-in GitHub version control feature, similar to GitHub Desktop. Supports pushing local code to GitHub repositories.',
    'docs.github_manual': 'Manual Mode',
    'docs.github_manual_desc': 'Select a repository, choose a local folder, view file change comparisons (New/Modified), input commit message, and push with one click.',
    'docs.github_bot': 'Auto Bot Mode',
    'docs.github_bot_desc': 'Automated watch mode that monitors local folder changes at set intervals (5 seconds to 1 hour) and automatically pushes to GitHub. Perfect for real-time backup and version control.',
    'docs.github_features': 'Key Features',
    'docs.github_feature_1': 'Create new repositories (Public/Private)',
    'docs.github_feature_2': 'Auto-fetch repository list and branches',
    'docs.github_feature_3': 'Smart file comparison (SHA hash)',
    'docs.github_feature_4': 'Auto-ignore node_modules, .git, dist folders',
    'docs.github_feature_5': 'Remember last selected folder',
    'docs.github_token': 'GitHub Token Setup',
    'docs.github_token_desc': 'Go to GitHub Settings → Developer Settings → Personal Access Tokens → Generate new token (classic), check "repo" scope, and copy the token.',
    'docs.theme_system': 'Theme System',
    'docs.theme_desc': 'Support multiple color themes: Sage, Ocean, Crimson, Amber. Click the theme button in the header to cycle through themes.',
    'docs.responsive': 'Responsive Design',
    'docs.responsive_desc': 'Fully responsive UI supporting mobile, tablet, and desktop. Header buttons auto-adapt, modals slide up from bottom on mobile for better touch experience.',
    'docs.got_it': 'I Understand',
  },
  zh: {
    // App General
    'app.title': 'XuanChen AI Studio',
    'app.description': 'XuanChen AI Studio 是一个基于 Gemini 架构的专业图像生成与编辑界面，支持精细的宽高比控制、高清输出支持以及多参考图输入。',
    'app.usage_guide': '使用指南',
    'app.prompt_placeholder': '描述您的想象...',
    'app.prompt_label': '创意提示词',
    'app.reference_label': '参考图片 (可选)',
    'app.generate_btn': '生成作品',
    'app.generating': '生成中...',
    'app.download': '下载',
    'app.output_title': '输出结果',
    'app.processing': '像素处理中...',
    'app.waiting_msg': '您的作品将出现在这里。\n配置设置并点击生成。',
    'app.error_prompt': '请输入提示词描述。',
    'app.error_api': '缺少 API Key。',
    'app.login_btn': '登录',
    'app.logout_btn': '锁定工作室',
    'app.payment_btn': '付费 / 支持',
    'app.account_btn': '账户',
    'app.theme_btn': '主题',

    // Themes
    'theme.sage': '山葵青 (Sage)',
    'theme.ocean': '深海蓝 (Ocean)',
    'theme.crimson': '绯红 (Crimson)',
    'theme.amber': '琥珀 (Amber)',

    // Control Panel
    'controls.title': '控制面板',
    'controls.active_model': '当前模型',
    'controls.aspect_ratio': '宽高比',
    'controls.resolution': '输出分辨率',
    'controls.configure_btn': '配置 API 与模型',

    // File Upload
    'upload.drop_text': '将参考图拖到这里',
    'upload.click_text': '或点击上传 (支持多张图片)',

    // Settings Modal
    'settings.title': 'API 设置',
    'settings.subtitle': '自定义 Gemini 接口参数与模型',
    'settings.apikey_label': 'API Key (自定义)',
    'settings.apikey_placeholder': 'sk-...',
    'settings.apikey_help': '留空则直接使用您环境绑定的 API Key (process.env.API_KEY)',
    'settings.baseurl_label': 'API 代理地址 (Base URL)',
    'settings.provider_google': 'Google 官方',
    'settings.provider_openrouter': 'OpenRouter',
    'settings.provider_custom': '自定义',
    'settings.model_label': '模型名称 (Model Name)',
    'settings.model_custom': '自定义 (Custom)',
    'settings.custom_placeholder': '输入模型 ID',
    'settings.payment_config': '收款配置',
    'settings.qr_upload_label': '上传收款码',
    'settings.qr_upload_btn': '选择图片',
    'settings.qr_upload_help': '上传您的微信/支付宝收款码。用户点击“付费/支持”时将看到此二维码。',
    'settings.security_title': '安全设置',
    'settings.change_password': '修改访问密码',
    'settings.new_password_placeholder': '输入新密码',
    'settings.update_btn': '更新密码',
    'settings.password_saved': '密码已更新',
    'settings.cancel': '取消',
    'settings.save': '保存配置',

    // Account Modal
    'account.title': '账户与安全',
    'account.subtitle': '管理您的访问密码与收款设置',

    // Auth & Payment
    'auth.title': '欢迎回来',
    'auth.password_label': '访问密码',
    'auth.password_placeholder': '请输入密码解锁',
    'auth.enter': '进入工作室',
    'payment.title': '支持 XuanChen AI',
    'payment.subtitle': '扫描下方二维码订阅会员或支持开发',
    'payment.no_qr': '暂未配置收款码',

    // Docs Modal
    'docs.title': '使用说明文档',
    'docs.subtitle': 'XuanChen AI Studio 操作指南',
    'docs.core_features': '核心功能',
    'docs.core_desc': 'XuanChen AI Studio 是一个基于 Gemini 架构的专业图像生成与编辑界面。它专注于提供极简的操作体验，支持多模态输入（文本 + 图像），并提供精细的宽高比控制和高清输出选项。',
    'docs.api_config': 'API 配置指南',
    'docs.api_key': 'API Key (密钥)',
    'docs.api_key_desc': '请在设置中输入您的 API Key。如果您留空，系统将自动尝试使用部署时环境变量中绑定的默认 Key。',
    'docs.base_url': 'Base URL (代理地址)',
    'docs.base_url_google': 'Google 官方: 连接 Google 原生服务器 (googleapis.com)。',
    'docs.base_url_openrouter': 'OpenRouter: 连接 OpenRouter 聚合接口。',
    'docs.base_url_custom': '自定义: 默认连接 XuanChen 专用加速节点 (ai.t8star.cn)。',
    'docs.model_strategy': '模型选择策略',
    'docs.model_banana_fast': '轻量级模型，适合快速迭代灵感、构图验证。不支持官方 API。',
    'docs.model_banana_pro': '增强版模型，语义理解更强，细节更丰富。不支持官方 API。',
    'docs.model_google': '谷歌官方最新视觉模型。必须选择 "Google 官方" Base URL 才能使用。',
    'docs.img_ref': '图片参考与编辑',
    'docs.img_ref_desc': '您可以拖拽或点击上传图片作为参考。',
    'docs.img_ref_note': '注意: 当上传图片时，系统会自动切换 API 模式至图生图接口 (`/edits`)。请确保您当前选择的模型支持图像输入功能。',
    'docs.github_sync': 'GitHub 同步',
    'docs.github_sync_desc': '内置 GitHub 版本管理功能，类似 GitHub Desktop。支持将本地代码推送到 GitHub 仓库。',
    'docs.github_manual': '手动模式',
    'docs.github_manual_desc': '选择仓库，选择本地文件夹，查看文件变更对比（新增/修改），输入提交信息，一键推送。',
    'docs.github_bot': '自动机器人模式',
    'docs.github_bot_desc': '自动监控模式，按设定间隔（5秒至1小时）监控本地文件夹变化，自动推送到 GitHub。适合实时备份和版本控制。',
    'docs.github_features': '核心功能',
    'docs.github_feature_1': '创建新仓库（公开/私有）',
    'docs.github_feature_2': '自动获取仓库列表和分支',
    'docs.github_feature_3': '智能文件对比（SHA 哈希）',
    'docs.github_feature_4': '自动忽略 node_modules, .git, dist 等文件夹',
    'docs.github_feature_5': '记住上次选择的文件夹',
    'docs.github_token': 'GitHub Token 设置',
    'docs.github_token_desc': '前往 GitHub Settings → Developer Settings → Personal Access Tokens → 生成新令牌 (classic)，勾选 "repo" 权限，复制令牌。',
    'docs.theme_system': '主题系统',
    'docs.theme_desc': '支持多种配色主题：山葵青、深海蓝、绯红、琥珀。点击顶部主题按钮可循环切换。',
    'docs.responsive': '响应式设计',
    'docs.responsive_desc': '完全响应式 UI，支持手机、平板、桌面端。顶部按钮自动适配，弹窗在手机端从底部滑入，触摸体验更佳。',
    'docs.got_it': '我明白了',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};