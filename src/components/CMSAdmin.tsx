import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';

interface CMSItem {
  _id?: string;
  contentType: string;
  key: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  date?: string;
  color?: string;
  data?: any;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CMSAdminProps {
  userToken?: string;
}

const API_BASE_URL = `${API_URL}/api`;
const CMS_CONTENT_TYPES = ['timeline', 'company_info', 'hero', 'features', 'founder', 'notice', 'contest_template'];

export default function CMSAdmin({ userToken: propUserToken }: CMSAdminProps) {
  const userToken = propUserToken || localStorage.getItem('figtyp_token') || '';
  const [contentType, setContentType] = useState<string>('timeline');
  const [items, setItems] = useState<CMSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<CMSItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CMSItem>({
    contentType: 'timeline',
    key: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    date: '',
    color: 'purple',
    order: 0,
    isActive: true
  });

  const fetchContent = async (type: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const res = userToken
        ? await fetch(`${API_BASE_URL}/cms`, { headers })
        : await fetch(`${API_BASE_URL}/cms/type/${type}`);

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const filtered = userToken ? list.filter((item: CMSItem) => item.contentType === type) : list;
        setItems(filtered);
        return;
      }

      if (!userToken) {
        const fallback = await fetch(`${API_BASE_URL}/cms/type/${type}`);
        if (fallback.ok) {
          const data = await fallback.json();
          setItems(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch CMS content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(contentType);
  }, [contentType]);

  const handleSave = async () => {
    try {
      const url = editingItem?._id
        ? `${API_BASE_URL}/cms/${editingItem._id}`
        : `${API_BASE_URL}/cms`;

      const method = editingItem?._id ? 'PUT' : 'POST';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (userToken) headers.Authorization = `Bearer ${userToken}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        const savedItem = data.content || data;

        setItems((prev) => {
          if (editingItem?._id) {
            return prev.map(item => item._id === editingItem._id ? savedItem : item);
          }
          return [...prev, savedItem];
        });

        setShowForm(false);
        setEditingItem(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save CMS content:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cms/${id}`, {
        method: 'DELETE',
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {}
      });

      if (res.ok) {
        setItems(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete CMS content:', error);
    }
  };

  const handleEdit = (item: CMSItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      contentType,
      key: '',
      title: '',
      shortDescription: '',
      fullDescription: '',
      date: '',
      color: 'purple',
      order: 0,
      isActive: true
    });
    setEditingItem(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">CMS Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" /> Add Content
        </motion.button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CMS_CONTENT_TYPES.map(type => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setContentType(type)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              contentType === type
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type.replace('_', ' ').toUpperCase()}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingItem ? 'Edit' : 'Create'} Content
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Content Type</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {CMS_CONTENT_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Key (unique identifier)</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    disabled={!!editingItem}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                    placeholder="e.g., timeline_item_1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Short Description</label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Enter short description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Full Description</label>
                  <textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Enter full description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g., Feb 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Color</label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="purple">Purple</option>
                      <option value="cyan">Cyan</option>
                      <option value="emerald">Emerald</option>
                      <option value="teal">Teal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
                >
                  <Save className="w-5 h-5" /> Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Key</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.key}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{item.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{item.contentType}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      item.isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => item._id && handleDelete(item._id)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading && (
          <div className="px-6 py-12 text-center text-slate-400">
            <p>No content found. Create your first item!</p>
          </div>
        )}
      </div>
    </div>
  );
}
