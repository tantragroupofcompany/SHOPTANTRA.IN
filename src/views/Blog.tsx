import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Blog() {
  const posts = [
    {
      title: 'How MSMEs and Artisans can Scale Online in India',
      excerpt: 'Discover the exact steps to register your business, optimize product catalogs, and leverage direct payment splits to grow your brand nationwide.',
      author: 'Rajesh Kumar',
      date: 'June 18, 2026',
      readTime: '5 min read',
      image: 'https://images.pexels.com/photos/3182750/pexels-photo-3182750.jpeg'
    },
    {
      title: 'Understanding Multi-Vendor Automated Payout Systems',
      excerpt: 'A detailed technical look at how wallet balances, escrow accounts, commission rates, and direct bank transfers keep payouts secure and rapid.',
      author: 'Amit Patel',
      date: 'June 14, 2026',
      readTime: '8 min read',
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg'
    },
    {
      title: 'Top Categories to Sell Online in 2026: Trends and Insights',
      excerpt: 'Analysing the rise of Swadeshi lifestyle products, organic groceries, and hand-woven fashion apparel in the current Indian retail scene.',
      author: 'Priya Sharma',
      date: 'June 10, 2026',
      readTime: '6 min read',
      image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Resources & News</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">ShopTantra Knowledge Hub</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Insights, guides, and stories from our engineering, product, and growth teams to help you maximize your marketplace performance.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <article key={i} className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={12} className="text-brand-orange" /> {post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-brand-navy-light/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-navy-light/10 rounded-full flex items-center justify-center text-xs font-bold text-brand-navy dark:text-white">
                        <User size={12} className="text-brand-orange" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{post.author}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-orange flex items-center gap-1 cursor-pointer hover:underline">
                      Read Article <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
