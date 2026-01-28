import React from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                <div>
                    <h1 className="text-5xl font-bold text-white mb-6">Get in touch</h1>
                    <p className="text-white/50 text-xl mb-12">
                        Institutional inquiries, partnership opportunities, or general support. We are here to help.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0"><Mail /></div>
                            <div>
                                <div className="text-white font-bold text-lg">Email Us</div>
                                <div className="text-white/60">institutional@Investoo.com</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0"><MapPin /></div>
                            <div>
                                <div className="text-white font-bold text-lg">Headquarters</div>
                                <div className="text-white/60">One World Trade Center, Suite 4500<br />New York, NY 10007</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="p-8 bg-[#0A0A0A] border-white/10">
                    <form className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" placeholder="John" />
                            <Input label="Last Name" placeholder="Doe" />
                        </div>
                        <Input label="Email" type="email" placeholder="john@company.com" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Message</label>
                            <textarea className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors h-32" placeholder="How can we help?"></textarea>
                        </div>
                        <Button className="w-full">Send Message</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
