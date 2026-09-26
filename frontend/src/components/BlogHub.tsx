import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, User, Tag, Search, ArrowLeft, Share2, 
  Eye, Sparkles, Check, ChevronRight, Bookmark, Flame
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';
import GoogleAd from './GoogleAd';

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  readTimeMinutes: number;
  tags: string[];
  isPublished: boolean;
  viewsCount: number;
  createdAt: string;
}

interface Props {
  onBackToApp?: () => void;
  showAd?: boolean;
}

export default function BlogHub({ onBackToApp, showAd = true }: Props) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/blogs`);
      const data = await res.json();
      if (data.success && data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Error loading blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Open an article and record view
  const openArticle = async (blog: BlogPost) => {
    setActiveArticle(blog);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch single article to update views count in backend
    try {
      const res = await fetch(`${API_URL}/api/blogs/${blog.slug}`);
      const data = await res.json();
      if (data.success && data.blog) {
        setActiveArticle(data.blog);
      }
    } catch (e) {
      // Ignore
    }
  };

  // Derive unique tag list
  const allTags = ['ALL', ...Array.from(new Set(blogs.flatMap((b) => b.tags || [])))];

  // Filtered blogs
  const filteredBlogs = blogs.filter((b) => {
    const matchesTag = selectedTag === 'ALL' || (b.tags && b.tags.includes(selectedTag));
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesTag && matchesSearch;
  });

  const handleCopyLink = () => {
    if (activeArticle) {
      const url = `${window.location.origin}/#blog-${activeArticle.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ================= VIEW 1: ARTICLE READER VIEW =================
  if (activeArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-black/10 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveArticle(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-2 border-black/10 dark:border-slate-800 font-mono text-xs font-bold text-black dark:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Article'}</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(activeArticle.tags || []).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-black dark:text-white leading-tight">
            {activeArticle.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-slate-400 font-sans leading-relaxed italic border-l-4 border-cyan-500 pl-4 py-1">
            &ldquo;{activeArticle.excerpt}&rdquo;
          </p>

          {/* Author Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-black/10 dark:border-slate-800/80 font-mono text-xs text-zinc-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <img
                src={activeArticle.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={activeArticle.author?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-black dark:border-slate-700"
              />
              <div>
                <div className="font-bold text-black dark:text-white">{activeArticle.author?.name || 'FigTyp Editorial'}</div>
                <div className="text-[10px] text-zinc-500 dark:text-slate-500">{activeArticle.author?.role || 'Technical Author'}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <strong>{activeArticle.readTimeMinutes || 5} min read</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>{activeArticle.viewsCount || 1} views</span>
              </span>
              <span>{new Date(activeArticle.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {activeArticle.coverImage && (
          <div className="rounded-3xl overflow-hidden border-2 border-black dark:border-slate-800 shadow-md">
            <img
              src={activeArticle.coverImage}
              alt={activeArticle.title}
              className="w-full h-64 sm:h-96 object-cover"
            />
          </div>
        )}

        {/* Article Body Content with Markdown */}
        <article className="prose prose-zinc dark:prose-invert max-w-none font-sans text-sm sm:text-base leading-relaxed space-y-6">
          <ReactMarkdown>{activeArticle.content}</ReactMarkdown>
        </article>

        {/* Safe Google Ad Placement inside Article */}
        {showAd && (
          <div className="pt-6 border-t-2 border-black/10 dark:border-slate-800">
            <GoogleAd
              slot="6677889900"
              format="horizontal"
              label="Article Sponsored Partner"
              className="my-4 max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Related Articles Footer */}
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" /> More Speed & Keyboard Guides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blogs
              .filter((b) => b._id !== activeArticle._id)
              .slice(0, 4)
              .map((b) => (
                <div
                  key={b._id}
                  onClick={() => openArticle(b)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-black/10 dark:border-slate-800 hover:border-cyan-500 cursor-pointer transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-black dark:text-white truncate">{b.title}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 dark:text-slate-400 mt-0.5">{b.readTimeMinutes} min read &bull; {b.tags?.[0]}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              ))}
          </div>
        </div>

      </div>
    );
  }

  // ================= VIEW 2: BLOG DIRECTORY CATALOG =================
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-mono text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>FigTyp Typing Academy & Guide Blogs</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-black dark:text-white tracking-tight">
          Master The Art & Science of Typing
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-400 font-sans leading-relaxed">
          Deep dives into cognitive neuroscience, mechanical switches, ergonomics, and muscle memory drills designed to elevate your speed from 40 to 120+ WPM.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, topics, switches, ergonomics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-black/15 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-black dark:text-white font-mono text-xs focus:border-cyan-500 outline-none shadow-sm"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                selectedTag === tag
                  ? 'bg-black text-white dark:bg-cyan-500 dark:text-slate-950 border-2 border-black dark:border-cyan-400 shadow-sm'
                  : 'bg-zinc-100 dark:bg-slate-900/60 text-zinc-700 dark:text-slate-400 hover:text-black dark:hover:text-white border-2 border-transparent'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured / Sponsor Banner */}
      {showAd && (
        <div className="w-full max-w-4xl mx-auto">
          <GoogleAd
            slot="9988771122"
            format="horizontal"
            label="Academy Sponsored Partner"
            className="my-2"
          />
        </div>
      )}

      {/* Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
          Loading typing academy articles...
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-black/20 dark:border-slate-800 rounded-3xl font-mono text-xs text-zinc-500">
          No articles found matching your query &ldquo;{searchQuery}&rdquo;. Try another topic.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <article
              key={blog._id}
              onClick={() => openArticle(blog)}
              className="group rounded-3xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-500 transition-all flex flex-col cursor-pointer"
            >
              {/* Cover Card Image */}
              <div className="relative h-44 w-full overflow-hidden bg-zinc-200 dark:bg-slate-800">
                <img
                  src={blog.coverImage || 'https://images.unsplash.com/photo-1510519138197-06b8f4400cf9?w=800'}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white font-mono text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{blog.readTimeMinutes || 5}m read</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(blog.tags || []).slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-base font-display text-black dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition leading-snug line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-slate-400 font-sans line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-black/10 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <img
                      src={blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={blog.author?.name}
                      className="w-5 h-5 rounded-full object-cover border border-black/20 dark:border-slate-700"
                    />
                    <span className="truncate max-w-[120px]">{blog.author?.name || 'FigTyp'}</span>
                  </div>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline flex items-center gap-0.5">
                    Read &rarr;
                  </span>
                </div>

              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
