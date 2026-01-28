import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, AreaSeries } from 'lightweight-charts';

/**
 * TradingView-style Performance Chart Component
 * Features:
 * - Pan left/right by dragging
 * - Scroll to zoom
 * - Crosshair with value tooltip
 * - 10-15 visible data points initially
 * - Smooth area gradient
 */
export default function PerformanceChart({ data, loading, className = '' }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: 'rgba(255, 255, 255, 0.4)',
                attributionLogo: false, // Remove TradingView watermark
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    width: 1,
                    style: 2, // Dashed
                    labelBackgroundColor: '#22c55e',
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#22c55e',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: 20, // Controls initial zoom level (higher = fewer visible bars)
                minBarSpacing: 5,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        // Create area series with gradient (v5 API)
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#22c55e',
            lineWidth: 2,
            topColor: 'rgba(34, 197, 94, 0.4)',
            bottomColor: 'rgba(34, 197, 94, 0.0)',
            priceFormat: {
                type: 'custom',
                formatter: (price) => '$' + price.toFixed(2),
            },
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
            crosshairMarkerBackgroundColor: '#22c55e',
            crosshairMarkerBorderColor: '#ffffff',
            crosshairMarkerBorderWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = areaSeries;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        // Initial size
        chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: 350,
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update data when it changes
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;

        if (data && data.length > 0) {
            // Transform data for lightweight-charts
            // Expected format: { time: 'YYYY-MM-DD', value: number }
            const chartData = data.map(item => ({
                time: item.date.split('T')[0], // Ensure YYYY-MM-DD format
                value: item.value,
            }));

            seriesRef.current.setData(chartData);

            // Set visible range to show last 10-15 data points
            const visibleBars = Math.min(12, chartData.length);
            if (chartData.length > visibleBars) {
                const fromIndex = chartData.length - visibleBars;
                chartRef.current.timeScale().setVisibleRange({
                    from: chartData[fromIndex].time,
                    to: chartData[chartData.length - 1].time,
                });
            } else {
                chartRef.current.timeScale().fitContent();
            }
        } else {
            seriesRef.current.setData([]);
        }
    }, [data]);

    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-lg">
                    <div className="flex items-center gap-2 text-white/60">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                </div>
            )}
            <div
                ref={chartContainerRef}
                className="w-full"
                style={{ height: '350px' }}
            />
            {!loading && (!data || data.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                    <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm">No performance data available yet</p>
                </div>
            )}
        </div>
    );
}
