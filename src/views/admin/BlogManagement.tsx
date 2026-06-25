import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, BookOpen, Calendar, User, Eye, ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  status: 'published' | 'draft';
  readTime: string;
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('Business');
  const [formAuthor, setFormAuthor] = useState('Admin Team');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formReadTime, setFormReadTime] = useState('5 min read');

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_blog_posts');
    if (stored) {
      setBlogs(JSON.parse(stored));
    } else {
      const defaultBlogs: BlogPost[] = [
        {
          id: 'blog-1',
          title: 'Swadeshi Movement in the Digital Era',
          excerpt: 'How local Indian MSMEs are leveraging digital marketplaces to reach national audiences.',
          content: 'The digital revolution has allowed Swadeshi artisans and micro-vendors to bypass middlemen and offer high-quality goods directly to buyers across India...',
          category: 'Business',
          author: 'Nayna Jadav',
          date: '2026-06-20',
          status: 'published',
          readTime: '6 min read'
        },
        {
          id: 'blog-2',
          title: 'Unlocking Organic Agriculture Profits',
          excerpt: 'A guide to organic farming certifications, local supply channels, and fair marketplace pricing.',
          content: 'Organic farming in regions like Kashmir and Gujarat has seen immense buyer interest. The key to vendor profitability lies in direct customer shipments...',
          category: 'Agriculture',
          author: 'Jadav Nilesh',
          date: '2026-06-18',
          status: 'published',
          readTime: '8 min read'
        }
      ];
      setBlogs(defaultBlogs);
      localStorage.setItem('admin_blog_posts', JSON.stringify(defaultBlogs));
    }
  }, []);

  const saveToStorage = (updated: BlogPost[]) => {
    setBlogs(updated);
    localStorage.setItem('admin_blog_posts', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormExcerpt('');
    setFormContent('');
    setFormCategory('Business');
    setFormAuthor('Admin Team');
    setFormStatus('published');
    setFormReadTime('5 min read');
    setEditingId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setFormTitle(blog.title);
    setFormExcerpt(blog.excerpt);
    setFormContent(blog.content);
    setFormCategory(blog.category);
    setFormAuthor(blog.author);
    setFormStatus(blog.status);
    setFormReadTime(blog.readTime);
    setEditingId(blog.id);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let updated: BlogPost[];
    if (editingId) {
      updated = blogs.map(b => 
        b.id === editingId 
          ? { 
              ...b, 
              title: formTitle, 
              excerpt: formExcerpt, 
              content: formContent, 
              category: formCategory, 
              author: formAuthor, 
              status: formStatus,
              readTime: formReadTime
            } 
          : b
      );
    } else {
      const newBlog: BlogPost = {
        id: `blog-${Date.now()}`,
        title: formTitle,
        excerpt: formExcerpt,
        content: formContent,
        category: formCategory,
        author: formAuthor,
        date: new Date().toISOString().split('T')[0],
        status: formStatus,
        readTime: formReadTime
      };
      updated = [...blogs, newBlog];
    }

    saveToStorage(updated);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      const updated = blogs.filter(b => b.id !== id);
      saveToStorage(updated);
    }
  };

  const togglePublishStatus = (id: string) => {
    const updated = blogs.map(b => 
      b.id === id ? { ...b, status: b.status === 'published' ? 'draft' : 'published' as const } : b
    );
    saveToStorage(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* View Mode vs Edit Mode */}
      {!isEditing ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog & Articles Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Author and publish community articles, guides, and merchant announcements.
              </p>
            </div>
            <Button onClick={handleOpenAdd} variant="primary" size="md" icon={<Plus size={16} />}>
              Create Article
            </Button>
          </div>

          {/* Grid list of articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 bg-white dark:bg-brand-navy rounded-3xl border border-gray-150/40 dark:border-brand-navy-light/10">
                <p className="text-gray-400 dark:text-gray-500">No blog posts found. Click "Create Article" to write one.</p>
              </div>
            ) : (
              blogs.map(blog => (
                <Card key={blog.id} className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10 flex flex-col justify-between h-full group hover:border-brand-orange/30 transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase px-2 py-0.5 rounded">
                        {blog.category}
                      </span>
                      <button 
                        onClick={() => togglePublishStatus(blog.id)}
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {blog.status === 'published' ? <Eye size={10} /> : <AlertCircle size={10} />}
                        {blog.status}
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-orange transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-brand-navy-light/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {blog.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {blog.date}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <Button onClick={() => handleOpenEdit(blog)} variant="outline" size="sm" icon={<Edit2 size={12} />} />
                      <Button onClick={() => handleDelete(blog.id)} variant="danger" size="sm" icon={<Trash2 size={12} />} />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        // Edit / Create Form Screen
        <Card className="border border-gray-150/40 dark:border-brand-navy-light/10">
          <div className="p-5 bg-gray-50 dark:bg-brand-navy-dark border-b border-gray-100 dark:border-brand-navy-light/10 flex items-center gap-3">
            <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-brand-navy-light/20 text-gray-500">
              <ArrowLeft size={16} />
            </button>
            <h2 className="font-extrabold text-gray-900 dark:text-white">
              {editingId ? 'Edit Article details' : 'Draft New Article'}
            </h2>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Article Title"
                placeholder="e.g. Swadeshi Crafts Revolution"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="Business">Business</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Ayurveda">Ayurveda</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Crafts">Crafts</option>
                </Select>

                <Input
                  label="Read Time"
                  placeholder="e.g. 5 min read"
                  value={formReadTime}
                  onChange={(e) => setFormReadTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Author Name"
                placeholder="e.g. Jadav Nilesh"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                required
              />

              <Select
                label="Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'published' | 'draft')}
              >
                <option value="published">Publish</option>
                <option value="draft">Save as Draft</option>
              </Select>
            </div>

            <Textarea
              label="Short Excerpt / Summary"
              placeholder="Provide a brief summary of the article..."
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              rows={3}
              required
            />

            <Textarea
              label="Article Content"
              placeholder="Write the full content of your article here (supports plain text)..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={12}
              required
            />

            <div className="pt-4 border-t border-gray-100 dark:border-brand-navy-light/10 flex justify-end gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline" size="md">Cancel</Button>
              <Button type="submit" variant="primary" size="md" icon={<Check size={16} />}>
                Save Article
              </Button>
            </div>
          </form>
        </Card>
      )}

    </div>
  );
}
