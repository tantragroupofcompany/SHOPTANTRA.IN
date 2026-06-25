import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

interface Page {
  id: string;
  name: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  status: 'active' | 'inactive';
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  expiryDate: string;
  status: 'published' | 'unpublished';
}

const CMS = () => {
  const [activeTab, setActiveTab] = useState<'pages' | 'banners' | 'announcements'>('pages');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pages
  const defaultPages: Page[] = [
    { id: '1', name: 'Home', slug: 'home', content: 'Welcome to ShopTantra', status: 'published' },
    { id: '2', name: 'About', slug: 'about', content: 'Learn about our platform', status: 'published' },
    { id: '3', name: 'Contact', slug: 'contact', content: 'Contact us form', status: 'published' },
    { id: '4', name: 'Privacy Policy', slug: 'privacy', content: 'Privacy policy text...', status: 'published' },
    { id: '5', name: 'Terms & Conditions', slug: 'terms', content: 'Terms and conditions text...', status: 'draft' },
  ];

  const [pages, setPages] = useState<Page[]>(() => {
    const stored = localStorage.getItem('cms_pages');
    return stored ? JSON.parse(stored) : defaultPages;
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const stored = localStorage.getItem('cms_banners');
    return stored ? JSON.parse(stored) : [
      { id: '1', title: 'Summer Sale', imageUrl: '/banner1.jpg', linkUrl: '/products', status: 'active' },
      { id: '2', title: 'New Arrivals', imageUrl: '/banner2.jpg', linkUrl: '/new', status: 'active' },
    ];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const stored = localStorage.getItem('cms_announcements');
    return stored ? JSON.parse(stored) : [
      { id: '1', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday', type: 'info', expiryDate: '2024-12-31', status: 'published' },
      { id: '2', title: 'Flash Sale Live', message: '50% off on selected items', type: 'success', expiryDate: '2024-12-25', status: 'published' },
    ];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cms_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('cms_banners', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('cms_announcements', JSON.stringify(announcements));
  }, [announcements]);

  // Page Editing
  const [pageForm, setPageForm] = useState<Page | null>(null);

  const handleEditPage = (page: Page) => {
    setPageForm(page);
    setEditingId(page.id);
    setIsModalOpen(true);
  };

  const handleSavePage = () => {
    if (!pageForm) return;
    if (editingId) {
      setPages(pages.map(p => p.id === editingId ? pageForm : p));
    }
    setIsModalOpen(false);
    setPageForm(null);
    setEditingId(null);
  };

  // Banner Management
  const [bannerForm, setBannerForm] = useState<Banner | null>(null);

  const handleEditBanner = (banner: Banner) => {
    setBannerForm(banner);
    setEditingId(banner.id);
    setIsModalOpen(true);
  };

  const handleSaveBanner = () => {
    if (!bannerForm) return;
    if (editingId) {
      setBanners(banners.map(b => b.id === editingId ? bannerForm : b));
    } else {
      setBanners([...banners, { ...bannerForm, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setBannerForm(null);
    setEditingId(null);
  };

  const handleAddBanner = () => {
    setBannerForm({ id: '', title: '', imageUrl: '', linkUrl: '', status: 'inactive' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const deleteBanner = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const toggleBannerStatus = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
  };

  // Announcement Management
  const [announcementForm, setAnnouncementForm] = useState<Announcement | null>(null);

  const handleEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementForm(announcement);
    setEditingId(announcement.id);
    setIsModalOpen(true);
  };

  const handleSaveAnnouncement = () => {
    if (!announcementForm) return;
    if (editingId) {
      setAnnouncements(announcements.map(a => a.id === editingId ? announcementForm : a));
    } else {
      setAnnouncements([...announcements, { ...announcementForm, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setAnnouncementForm(null);
    setEditingId(null);
  };

  const handleAddAnnouncement = () => {
    setAnnouncementForm({ id: '', title: '', message: '', type: 'info', expiryDate: '', status: 'unpublished' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const toggleAnnouncementStatus = (id: string) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, status: a.status === 'published' ? 'unpublished' : 'published' } : a));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'pages' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Pages
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'banners' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Banners
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'announcements' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Announcements
        </button>
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {pages.map(page => (
            <Card key={page.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{page.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{page.content.substring(0, 100)}...</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge label={page.status} variant={page.status === 'published' ? 'success' : 'default'} size="sm" />
                    <span className="text-xs text-gray-500">/{page.slug}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={() => handleEditPage(page)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div>
          <div className="mb-6">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleAddBanner}>
              Add Banner
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map(banner => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="bg-gray-200 h-32 mb-4 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-sm">Image Preview</div>
                    <div className="text-xs">{banner.imageUrl}</div>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <p className="text-sm text-gray-500 mt-1">Link: {banner.linkUrl}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge label={banner.status} variant={banner.status === 'active' ? 'success' : 'default'} size="sm" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={() => handleEditBanner(banner)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" icon={banner.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} onClick={() => toggleBannerStatus(banner.id)}>
                    {banner.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteBanner(banner.id)} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          <div className="mb-6">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleAddAnnouncement}>
              Add Announcement
            </Button>
          </div>
          <div className="space-y-4">
            {announcements.map(announcement => (
              <Card key={announcement.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <Badge label={announcement.type} variant={announcement.type === 'success' ? 'success' : announcement.type === 'warning' ? 'warning' : 'info'} size="sm" />
                    </div>
                    <p className="text-gray-600 text-sm">{announcement.message}</p>
                    <div className="mt-3 text-xs text-gray-500">
                      Expires: {announcement.expiryDate}
                    </div>
                    <div className="mt-2">
                      <Badge label={announcement.status} variant={announcement.status === 'published' ? 'success' : 'default'} size="sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={() => handleEditAnnouncement(announcement)} />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={announcement.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      onClick={() => toggleAnnouncementStatus(announcement.id)}
                    />
                    <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteAnnouncement(announcement.id)} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Page Edit Modal */}
      <Modal isOpen={isModalOpen && activeTab === 'pages' && pageForm} onClose={() => { setIsModalOpen(false); setPageForm(null); }} title="Edit Page" size="lg">
        {pageForm && (
          <div className="space-y-4">
            <Input label="Page Name" value={pageForm.name} onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })} disabled />
            <Textarea label="Content" value={pageForm.content} onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })} rows={6} />
            <Select
              label="Status"
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={pageForm.status}
              onChange={(e) => setPageForm({ ...pageForm, status: e.target.value as 'published' | 'draft' })}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="primary" onClick={handleSavePage}>Save Page</Button>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); setPageForm(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Banner Edit Modal */}
      <Modal isOpen={isModalOpen && activeTab === 'banners' && bannerForm} onClose={() => { setIsModalOpen(false); setBannerForm(null); }} title={editingId ? 'Edit Banner' : 'Add Banner'} size="md">
        {bannerForm && (
          <div className="space-y-4">
            <Input label="Banner Title" placeholder="e.g., Summer Sale" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
            <Input label="Image URL" placeholder="https://example.com/image.jpg" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} />
            <Input label="Link URL" placeholder="e.g., /products" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={bannerForm.status}
              onChange={(e) => setBannerForm({ ...bannerForm, status: e.target.value as 'active' | 'inactive' })}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="primary" onClick={handleSaveBanner}>Save Banner</Button>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); setBannerForm(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Announcement Edit Modal */}
      <Modal isOpen={isModalOpen && activeTab === 'announcements' && announcementForm} onClose={() => { setIsModalOpen(false); setAnnouncementForm(null); }} title={editingId ? 'Edit Announcement' : 'Add Announcement'} size="md">
        {announcementForm && (
          <div className="space-y-4">
            <Input label="Title" placeholder="Announcement title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
            <Textarea label="Message" placeholder="Announcement message" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} rows={4} />
            <Select
              label="Type"
              options={[
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Warning' },
                { value: 'success', label: 'Success' },
              ]}
              value={announcementForm.type}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as 'info' | 'warning' | 'success' })}
            />
            <Input label="Expiry Date" type="date" value={announcementForm.expiryDate} onChange={(e) => setAnnouncementForm({ ...announcementForm, expiryDate: e.target.value })} />
            <Select
              label="Status"
              options={[
                { value: 'published', label: 'Published' },
                { value: 'unpublished', label: 'Unpublished' },
              ]}
              value={announcementForm.status}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, status: e.target.value as 'published' | 'unpublished' })}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="primary" onClick={handleSaveAnnouncement}>Save Announcement</Button>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); setAnnouncementForm(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CMS;
