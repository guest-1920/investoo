import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {useAuth} from "../../context/AuthContext";

export default function HeroNetwork() {
    const {user}=useAuth();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        // Configuration
        const particleCount = 60;
        const connectionDistance = 150;
        const mouseDistance = 200;

        // Mouse state
        let mouseX = -1000;
        let mouseY = -1000;

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction (repulsion)
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseDistance - distance) / mouseDistance;
                    const directionX = forceDirectionX * force * 0.5;
                    const directionY = forceDirectionY * force * 0.5;
                    this.vx += directionX;
                    this.vy += directionY;
                }

                // Dampen velocity back to normal
                // (Simplified damping by constraining max speed)
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > 1.5) {
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                }
            }

            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        // Init
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="relative h-screen w-full bg-background overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

            <div className="relative z-10 text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <div className="inline-block px-3 py-1 mb-6 border border-white/10 rounded-full bg-transparent backdrop-blur-sm">
                        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                            The Future of Investing
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter mb-6">
                        Wealth, <span className="text-white/40">Connected.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                        Experience the precision of algorithmic portfolio management.
                        Investoo unifies global markets into a single, intelligent interface.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none mx-auto">
  {user ? (
    <Link
      to="/plans"
      className="w-full sm:w-auto min-w-[220px] h-14 px-8 bg-white text-black font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] text-center flex justify-center items-center"
    >
      Start Investing
    </Link>
  ) : (
    <Link
      to="/login"
      state={{ from: { pathname: "/plans" } }}
      className="w-full sm:w-auto min-w-[220px] h-14 px-8 bg-white text-black font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] text-center flex justify-center items-center"
    >
      Start Investing
    </Link>
  )}

  <button className="contents">
    <Link
      to="/methodology"
      className="w-full sm:w-auto min-w-[220px] h-14 px-8 bg-white/5 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm text-center flex justify-center items-center"
    >
      View Methodology
    </Link>
  </button>
</div>

                </motion.div>
            </div>


        </div>
    );
}
