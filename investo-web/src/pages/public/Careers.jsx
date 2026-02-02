import React from 'react';
import { CAREERS_JOBS } from '../../data/content';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Briefcase } from 'lucide-react';

export default function Careers() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <h1 className="text-5xl font-bold text-white mb-6">Join the Revolution</h1>
                <p className="text-xl text-white/50 max-w-2xl mx-auto">We are looking for brilliant minds to solve the hardest problems in finance.</p>
            </div>

            <div className="grid gap-6 max-w-4xl mx-auto">
            
                {CAREERS_JOBS.length ===0 ? (
                    <p className="text-center text-white/50">We are not hiring at the moment. Please check back later.</p>
                ) : CAREERS_JOBS.map((job, idx) => (
                    <Card key={idx} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-white/10 bg-[#0A0A0A]">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{job.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-white/50">
                                <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs uppercase font-bold">{job.type}</span>
                            </div>
                        </div>
                        <Button variant="outline">Apply Now</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
