import React, { useState } from 'react';
import { BLOG_POSTS } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Insights() {
    const [search, setSearch] = useState('');

    const filteredPosts = BLOG_POSTS.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Market Insights</h1>
                    <p className="text-white/50 text-xl">Analysis, trends, and educational resources from our quantitative desk.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all placeholder-white/20"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                    <Link to={`/insights/${post.id}`} key={post.id} className="group">
                        <Card hover className="h-full flex flex-col p-0 overflow-hidden border-white/5 bg-[#0A0A0A]">
                            <div className="h-48 relative overflow-hidden">
                                {/* Image Background */}
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />

                                <div className="absolute top-4 left-4 z-10">
                                    <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                        {post.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1 relative z-10 -mt-6">
                                <div className="mb-4 flex items-center gap-2 text-xs text-white/40 font-medium">
                                    <span>{post.date}</span>
                                    <span>•</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-white/50 text-sm line-clamp-3 mb-8 flex-1">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:translate-x-1 transition-transform">
                                    Read Analysis <ArrowRight size={16} />
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-20 text-white/30">
                    No articles found matching "{search}"
                </div>
            )}
        </div>
    );
}
