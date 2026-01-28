import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/content';
import { ArrowLeft, Share2, Twitter, Linkedin } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function BlogPost() {
    const { id } = useParams();
    const post = BLOG_POSTS.find(p => p.id === id);

    if (!post) {
        return <Navigate to="/insights" replace />;
    }

    return (
        <div className="pt-32 pb-20 px-6">
            <article className="max-w-4xl mx-auto">
                <Link to="/insights" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Insights
                </Link>

                {/* Hero Image */}
                <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-12 relative border border-white/10">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                </div>

                <header className="mb-12 max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                            {post.category}
                        </span>
                        <span className="text-white/40 text-sm">{post.date}</span>
                        <span className="text-white/40 text-sm">• {post.readTime}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">{post.title}</h1>
                    <p className="text-xl text-white/60 leading-relaxed border-l-4 border-white/10 pl-6">
                        {post.excerpt}
                    </p>
                </header>

                <div className="prose prose-invert prose-lg max-w-3xl mx-auto text-white/80">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>

                <div className="max-w-3xl mx-auto">
                    <hr className="border-white/10 my-12" />

                    <div className="flex items-center justify-between">
                        <div className="text-white/40 text-sm">
                            Share this article
                        </div>
                        <div className="flex gap-4">
                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"><Twitter size={20} /></button>
                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"><Linkedin size={20} /></button>
                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"><Share2 size={20} /></button>
                        </div>
                    </div>

                    {/* CTA */}
                    {/* CTA */}
                    <div className="mt-20 relative overflow-hidden rounded-3xl border border-white/10 group">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-[#0A0A0A]" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10 p-12 md:p-16 text-center">
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Start your quantitative journey</h3>
                            <p className="text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
                                Join thousands of institutional investors leveraging Investoo's algo-driven strategies today.
                            </p>
                            <Link to="/register" className="inline-block">
                                <Button className="px-10 py-4 text-base shadow-xl shadow-blue-500/10">
                                    Create Free Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
