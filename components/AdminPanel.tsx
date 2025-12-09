import React, { useState } from 'react';
import { 
  X, Users, CreditCard, Activity, TrendingUp, Settings, 
  UserCheck, UserX, Trash2, Edit2, Save, Search, Filter,
  ChevronDown, ChevronUp, Crown, Shield, User as UserIcon,
  DollarSign, Calendar, BarChart3, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, PLANS } from '../contexts/AuthContext';
import { Member, PlanType, MemberRole } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'users' | 'payments' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { members, payments, usageRecords, getAdminStats, updateMember, deleteMember } = useAuth();
  
  const [tab, setTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all');
  
  const stats = getAdminStats();
  
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || m.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const getRoleBadge = (role: MemberRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1"><Shield size={10} /> Admin</span>;
      case 'vip':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1"><Crown size={10} /> VIP</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full flex items-center gap-1"><UserIcon size={10} /> User</span>;
    }
  };

  const getPlanBadge = (plan: PlanType) => {
    const colors: Record<PlanType, string> = {
      free: 'bg-slate-500/20 text-slate-400',
      basic: 'bg-blue-500/20 text-blue-400',
      pro: 'bg-brand-500/20 text-brand-400',
      enterprise: 'bg-purple-500/20 text-purple-400',
    };
    return <span className={`px-2 py-0.5 ${colors[plan]} text-xs rounded-full capitalize`}>{plan}</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-5xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-dark-700 bg-dark-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Shield className="text-red-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {language === 'zh' ? '后台管理' : 'Admin Panel'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                {language === 'zh' ? '管理用户、订单和系统设置' : 'Manage users, orders and settings'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-700 px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', icon: BarChart3, label: language === 'zh' ? '概览' : 'Overview' },
            { id: 'users', icon: Users, label: language === 'zh' ? '用户' : 'Users' },
            { id: 'payments', icon: CreditCard, label: language === 'zh' ? '订单' : 'Payments' },
            { id: 'settings', icon: Settings, label: language === 'zh' ? '设置' : 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                tab === item.id 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '总用户' : 'Total Users'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">¥{stats.totalRevenue.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '总收入' : 'Total Revenue'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="text-purple-400" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalGenerations}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '总生成' : 'Generations'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-amber-400" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">+{stats.newUsersToday}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '今日新增' : 'New Today'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-dark-900/50 rounded-xl border border-dark-700 p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-brand-400" />
                  {language === 'zh' ? '最近活动' : 'Recent Activity'}
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {usageRecords.slice(0, 10).map(record => (
                    <div key={record.id} className="flex items-center justify-between text-sm p-2 hover:bg-dark-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          record.type === 'generation' ? 'bg-brand-400' :
                          record.type === 'edit' ? 'bg-blue-400' : 'bg-purple-400'
                        }`} />
                        <span className="text-slate-300">{record.type}</span>
                        <span className="text-slate-500 text-xs truncate max-w-[200px]">{record.prompt || '-'}</span>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {usageRecords.length === 0 && (
                    <p className="text-slate-500 text-center py-4">
                      {language === 'zh' ? '暂无活动记录' : 'No activity yet'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as PlanType | 'all')}
                  className="bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="all">{language === 'zh' ? '全部套餐' : 'All Plans'}</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-dark-900/50 rounded-xl border border-dark-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-800 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '用户' : 'User'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '角色' : 'Role'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '套餐' : 'Plan'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '积分' : 'Credits'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '状态' : 'Status'}</th>
                        <th className="px-4 py-3 text-right">{language === 'zh' ? '操作' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {filteredMembers.map(member => (
                        <tr key={member.id} className="hover:bg-dark-800/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white font-medium">{member.username}</p>
                              <p className="text-slate-500 text-xs">{member.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                          <td className="px-4 py-3">{getPlanBadge(member.plan)}</td>
                          <td className="px-4 py-3">
                            <span className="text-slate-300">{member.credits}</span>
                            <span className="text-slate-500">/{member.totalCredits}</span>
                          </td>
                          <td className="px-4 py-3">
                            {member.isActive ? (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1 w-fit">
                                <UserCheck size={10} /> Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1 w-fit">
                                <UserX size={10} /> Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingMember(member)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                                title={language === 'zh' ? '编辑' : 'Edit'}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => updateMember(member.id, { isActive: !member.isActive })}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  member.isActive 
                                    ? 'text-amber-400 hover:bg-amber-500/20' 
                                    : 'text-green-400 hover:bg-green-500/20'
                                }`}
                                title={member.isActive ? (language === 'zh' ? '禁用' : 'Disable') : (language === 'zh' ? '启用' : 'Enable')}
                              >
                                {member.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                              {member.role !== 'admin' && (
                                <button
                                  onClick={() => {
                                    if (confirm(language === 'zh' ? '确定删除此用户？' : 'Delete this user?')) {
                                      deleteMember(member.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title={language === 'zh' ? '删除' : 'Delete'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <p className="text-slate-500 text-xs text-center">
                {language === 'zh' 
                  ? `共 ${filteredMembers.length} 个用户` 
                  : `${filteredMembers.length} users total`}
              </p>
            </div>
          )}

          {/* Payments Tab */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-dark-900/50 rounded-xl border border-dark-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-800 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '套餐' : 'Plan'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '金额' : 'Amount'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '方式' : 'Method'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '状态' : 'Status'}</th>
                        <th className="px-4 py-3 text-left">{language === 'zh' ? '时间' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-dark-800/50">
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{payment.id.slice(0, 8)}...</td>
                          <td className="px-4 py-3">{getPlanBadge(payment.plan)}</td>
                          <td className="px-4 py-3 text-white font-medium">¥{payment.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-300 capitalize">{payment.method}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              payment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              payment.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                              payment.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(payment.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            {language === 'zh' ? '暂无订单记录' : 'No payment records'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-dark-900/50 rounded-xl border border-dark-700 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Settings size={16} className="text-brand-400" />
                  {language === 'zh' ? '系统设置' : 'System Settings'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
                    <div>
                      <p className="text-slate-200 font-medium">{language === 'zh' ? '新用户默认积分' : 'Default Credits for New Users'}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '新注册用户获得的初始积分' : 'Initial credits for new registrations'}</p>
                    </div>
                    <input 
                      type="number" 
                      defaultValue={10}
                      className="w-20 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm text-center"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
                    <div>
                      <p className="text-slate-200 font-medium">{language === 'zh' ? '每次生成消耗' : 'Credits per Generation'}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '每次图片生成扣除的积分数' : 'Credits deducted per image generation'}</p>
                    </div>
                    <input 
                      type="number" 
                      defaultValue={1}
                      className="w-20 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm text-center"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
                    <div>
                      <p className="text-slate-200 font-medium">{language === 'zh' ? '开放注册' : 'Open Registration'}</p>
                      <p className="text-slate-500 text-xs">{language === 'zh' ? '允许新用户自主注册' : 'Allow new users to register'}</p>
                    </div>
                    <button className="w-12 h-6 bg-brand-500 rounded-full relative transition-colors">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>
              
              <button className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <Save size={16} />
                {language === 'zh' ? '保存设置' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-white">
                {language === 'zh' ? '编辑用户' : 'Edit User'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{language === 'zh' ? '用户名' : 'Username'}</label>
                  <input
                    type="text"
                    value={editingMember.username}
                    onChange={(e) => setEditingMember({ ...editingMember, username: e.target.value })}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{language === 'zh' ? '角色' : 'Role'}</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as MemberRole })}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="vip">VIP</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{language === 'zh' ? '套餐' : 'Plan'}</label>
                  <select
                    value={editingMember.plan}
                    onChange={(e) => setEditingMember({ ...editingMember, plan: e.target.value as PlanType })}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    {PLANS.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{language === 'zh' ? '积分' : 'Credits'}</label>
                  <input
                    type="number"
                    value={editingMember.credits}
                    onChange={(e) => setEditingMember({ ...editingMember, credits: parseInt(e.target.value) || 0 })}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl transition-colors"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    updateMember(editingMember.id, editingMember);
                    setEditingMember(null);
                  }}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
                >
                  {language === 'zh' ? '保存' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

