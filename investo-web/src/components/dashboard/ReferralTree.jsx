import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';


// Build hierarchical tree structure
const buildTree = (referrals) => {
    const directReferrals = referrals.filter(r => r.level === 1 || r.referredBy === null);
    const findChildren = (parentId) => referrals.filter(r => r.referredBy === parentId);
    const buildNode = (referral, depth = 1) => ({
        ...referral,
        depth,
        children: findChildren(referral.id).map(child => buildNode(child, depth + 1))
    });
    return directReferrals.map(ref => buildNode(ref, 1));
};

// Referral Node Component
const ReferralNode = ({ node, index, expandedNodes, onToggle, depth = 1 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    // Warm gold/amber accent colors for financial feel
    const accentColor = '#F59E0B';
    const greenColor = '#10B981';

    return (
        <div className="referral-node-container">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => hasChildren && onToggle(node.id)}
                className="referral-node-wrapper"
                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
            >
                <div
                    className="referral-card"
                    style={{
                        background: isHovered
                            ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 17, 17, 0.95) 100%)'
                            : 'linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(17, 17, 17, 0.95) 100%)',
                        border: isHovered ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isHovered
                            ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)'
                            : '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                >
                    {/* Avatar and Info */}
                    <div className="referral-header">
                        <div className="referral-avatar">
                            {node.name?.charAt(0) || '?'}
                        </div>
                        <div className="referral-info">
                            <div className="referral-name">{node.name}</div>
                            <div className="referral-level" style={{ color: accentColor }}>
                                Level {depth} Referral
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="referral-stats">
                        <div className="stat-item">
                            <div className="stat-label">Plans</div>
                            <div className="stat-value">{node.plansBought || 0}</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-label">Earned</div>
                            <div className="stat-value" style={{ color: greenColor }}>+${node.bonus || 0}</div>
                        </div>
                    </div>

                    {/* Expand indicator */}
                    {hasChildren && (
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className="expand-indicator"
                            style={{ color: accentColor }}
                        >
                            ▼
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Children */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="children-container"
                    >
                        {/* Vertical connector */}
                        <div className="connector-vertical" />

                        {/* Horizontal connector */}
                        {node.children.length > 1 && (
                            <div
                                className="connector-horizontal"
                                style={{ width: `${(node.children.length - 1) * 140}px` }}
                            />
                        )}

                        {/* Child nodes */}
                        <div className="children-wrapper">
                            {node.children.map((child, i) => (
                                <div key={child.id} className="child-node-container">
                                    <div className="connector-to-child" />
                                    <ReferralNode
                                        node={child}
                                        index={i}
                                        expandedNodes={expandedNodes}
                                        onToggle={onToggle}
                                        depth={depth + 1}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ReferralTree = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [isRootExpanded, setIsRootExpanded] = useState(true);

    useEffect(() => {
        const fetchReferralTree = async () => {
            try {
                const response = await api.get('/referrals/tree');
                if (response.data?.referrals?.length > 0) {
                    const mappedReferrals = response.data.referrals.map((ref, index) => ({
                        id: ref.id || index + 1,
                        name: ref.name,
                        referredBy: ref.level === 1 ? null : ref.referredBy,
                        bonus: ref.bonus || 0,
                        joinedDate: ref.joinedDate,
                        level: ref.level,
                        plansBought: ref.plansBought || 0,
                        totalPlanValue: ref.totalPlanValue || 0,
                    }));
                    setReferrals(mappedReferrals);
                    setExpandedNodes(new Set(mappedReferrals.filter(r => r.level === 1).map(r => r.id)));
                }
            } catch (error) {
                console.error('Failed to fetch referral tree:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReferralTree();
    }, []);

    const tree = useMemo(() => buildTree(referrals), [referrals]);

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
            return newSet;
        });
    };

    const toggleRoot = () => {
        setIsRootExpanded(prev => !prev);
    };

    return (
        <>
            <style>{`
                .referral-tree-container {
                    width: 100%;
                    min-height: 400px;
                    padding: 16px;
                    overflow-x: auto;
                    overflow-y: visible;
                    -webkit-overflow-scrolling: touch;
                }
                
                .referral-tree-inner {
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 100%;
                    padding-bottom: 40px;
                }
                
                /* You Node */
                .you-node {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .you-avatar {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
                }
                
                .you-label {
                    color: #FFFFFF;
                    font-weight: 600;
                    margin-top: 8px;
                    font-size: 13px;
                }
                
                .you-sublabel {
                    color: rgba(255,255,255,0.4);
                    font-size: 11px;
                    margin-top: 2px;
                }
                
                .you-connector {
                    width: 2px;
                    height: 24px;
                    background: linear-gradient(180deg, rgba(245, 158, 11, 0.5) 0%, rgba(245, 158, 11, 0.1) 100%);
                    margin-top: 10px;
                }
                
                /* First level connector */
                .first-level-connector {
                    height: 2px;
                    background: rgba(245, 158, 11, 0.2);
                    margin-bottom: 0;
                }
                
                /* First level nodes */
                .first-level-wrapper {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .first-level-node {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .first-level-node .connector-to-child {
                    width: 2px;
                    height: 18px;
                    background: rgba(245, 158, 11, 0.2);
                }
                
                /* Referral Node */
                .referral-node-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .referral-node-wrapper {
                    position: relative;
                }
                
                .referral-card {
                    border-radius: 12px;
                    padding: 14px;
                    min-width: 130px;
                    max-width: 160px;
                    transition: all 0.25s ease;
                }
                
                .referral-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                
                .referral-avatar {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-weight: 700;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                }
                
                .referral-info {
                    min-width: 0;
                    flex: 1;
                }
                
                .referral-name {
                    color: #FFFFFF;
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .referral-level {
                    font-size: 10px;
                    font-weight: 500;
                }
                
                .referral-stats {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                }
                
                .stat-item {
                    flex: 1;
                    text-align: center;
                }
                
                .stat-label {
                    color: rgba(255,255,255,0.4);
                    font-size: 9px;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat-value {
                    color: #FFFFFF;
                    font-weight: 700;
                    font-size: 16px;
                }
                
                .stat-divider {
                    width: 1px;
                    background: rgba(255,255,255,0.1);
                }
                
                .expand-indicator {
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #1a1a1a;
                    border: 2px solid rgba(245, 158, 11, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                }
                
                /* Children */
                .children-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .connector-vertical {
                    width: 2px;
                    height: 24px;
                    background: linear-gradient(180deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.1) 100%);
                    margin-top: 10px;
                }
                
                .connector-horizontal {
                    height: 2px;
                    background: rgba(245, 158, 11, 0.2);
                    max-width: 500px;
                }
                
                .children-wrapper {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .child-node-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .connector-to-child {
                    width: 2px;
                    height: 18px;
                    background: rgba(245, 158, 11, 0.2);
                }
                
                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 40px 16px;
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .empty-title {
                    color: #FFFFFF;
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .empty-subtitle {
                    color: rgba(255,255,255,0.5);
                    font-size: 13px;
                }
                
                /* Desktop overrides */
                @media (min-width: 768px) {
                    .referral-tree-container {
                        padding: 24px;
                    }
                    
                    .you-avatar {
                        width: 64px;
                        height: 64px;
                        border-radius: 16px;
                        font-size: 28px;
                    }
                    
                    .you-label {
                        font-size: 14px;
                    }
                    
                    .you-sublabel {
                        font-size: 12px;
                    }
                    
                    .you-connector {
                        height: 32px;
                    }
                    
                    .first-level-wrapper {
                        gap: 20px;
                    }
                    
                    .referral-card {
                        border-radius: 16px;
                        padding: 20px;
                        min-width: 180px;
                        max-width: 200px;
                    }
                    
                    .referral-header {
                        gap: 14px;
                        margin-bottom: 16px;
                    }
                    
                    .referral-avatar {
                        width: 48px;
                        height: 48px;
                        min-width: 48px;
                        border-radius: 12px;
                        font-size: 18px;
                    }
                    
                    .referral-name {
                        font-size: 15px;
                    }
                    
                    .referral-level {
                        font-size: 12px;
                    }
                    
                    .referral-stats {
                        gap: 16px;
                        padding: 14px;
                        border-radius: 10px;
                    }
                    
                    .stat-label {
                        font-size: 11px;
                        margin-bottom: 4px;
                    }
                    
                    .stat-value {
                        font-size: 20px;
                    }
                    
                    .expand-indicator {
                        width: 28px;
                        height: 28px;
                        bottom: -14px;
                        font-size: 10px;
                    }
                    
                    .connector-vertical {
                        height: 32px;
                        margin-top: 14px;
                    }
                    
                    .connector-horizontal {
                        max-width: 700px;
                    }
                    
                    .children-wrapper {
                        gap: 20px;
                    }
                    
                    .connector-to-child {
                        height: 24px;
                    }
                    
                    .first-level-node .connector-to-child {
                        height: 24px;
                    }
                    
                    .empty-icon {
                        font-size: 56px;
                    }
                    
                    .empty-title {
                        font-size: 20px;
                    }
                    
                    .empty-subtitle {
                        font-size: 14px;
                    }
                }
            `}</style>

            <div className="referral-tree-container">
                <div className="referral-tree-inner">
                    {/* "You" Node - Clickable to expand/collapse entire tree */}
                    <div
                        className="you-node"
                        onClick={tree.length > 0 ? toggleRoot : undefined}
                        style={{ cursor: tree.length > 0 ? 'pointer' : 'default' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="you-avatar"
                            style={{ position: 'relative' }}
                        >
                            👤
                        </motion.div>
                        <div className="you-label">You</div>
                        <div className="you-sublabel">Network Owner</div>

                        {tree.length > 0 && (
                            <>
                                <motion.div
                                    animate={{ rotate: isRootExpanded ? 180 : 0 }}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#1a1a1a',
                                        border: '2px solid rgba(245, 158, 11, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#F59E0B',
                                        fontSize: '9px',
                                        marginTop: '10px',
                                    }}
                                >
                                    ▼
                                </motion.div>
                            </>
                        )}
                    </div>

                    {/* Tree content - only shown when root is expanded */}
                    <AnimatePresence>
                        {isRootExpanded && tree.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                {/* Connector from You to first level */}
                                <div className="you-connector" />

                                {/* Horizontal connector for first level */}
                                {tree.length > 1 && (
                                    <div
                                        className="first-level-connector"
                                        style={{ width: `${(tree.length - 1) * 150}px`, maxWidth: '600px' }}
                                    />
                                )}

                                {/* First Level Nodes */}
                                <div className="first-level-wrapper">
                                    {tree.map((node, i) => (
                                        <div key={node.id} className="first-level-node">
                                            {tree.length > 1 && <div className="connector-to-child" />}
                                            <ReferralNode
                                                node={node}
                                                index={i}
                                                expandedNodes={expandedNodes}
                                                onToggle={toggleNode}
                                                depth={1}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Empty state */}
                    {tree.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="empty-state"
                        >
                            <div className="empty-icon">🌱</div>
                            <div className="empty-title">No referrals yet</div>
                            <div className="empty-subtitle">
                                Share your referral code to start growing your network!
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ReferralTree;