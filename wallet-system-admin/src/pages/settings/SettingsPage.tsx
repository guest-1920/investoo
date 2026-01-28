import { useState, useEffect } from 'react';
import {
    SettingsService,
    SETTINGS_KEYS,
    type ReferralSettings,
    type FinancialSettings
} from '../../services/settings.service';
import { PlusIcon, TrashIcon } from '../../components/ui/Icons';
import './SettingsPage.css';

export const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditingReferral, setIsEditingReferral] = useState(false);
    const [isEditingFinancial, setIsEditingFinancial] = useState(false);

    type ReferralLevelConfigForm = {
        level: number;
        percentage: number | string;
    };

    interface ReferralSettingsForm {
        levels: ReferralLevelConfigForm[];
    }

    const [referralSettings, setReferralSettings] = useState<ReferralSettingsForm>({ levels: [] });
    // Allow string | number for form inputs to handle decimal typing and empty states smoothly
    type FinancialSettingsForm = {
        [K in keyof FinancialSettings]: number | string;
    };
    const [financialSettings, setFinancialSettings] = useState<FinancialSettingsForm>({
        withdrawalFee: 0,
        minWithdrawal: 0,
        minRecharge: 0,
        principalTax: 0,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const [referral, financial] = await Promise.all([
                SettingsService.getSettings<ReferralSettings>(SETTINGS_KEYS.REFERRAL),
                SettingsService.getSettings<FinancialSettings>(SETTINGS_KEYS.FINANCIAL)
            ]);

            if (referral && referral.levels) {
                referral.levels.sort((a, b) => a.level - b.level);
                setReferralSettings(referral);
            }
            if (financial) setFinancialSettings(financial);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReferral = async () => {
        try {
            setSaving(true);
            const cleanLevels = referralSettings.levels.map((l, index) => ({
                level: index + 1,
                percentage: Number(l.percentage)
            }));

            await SettingsService.updateSettings(SETTINGS_KEYS.REFERRAL, { levels: cleanLevels });
            await fetchSettings();
            setIsEditingReferral(false);
        } catch (error) {
            console.error('Failed to save referral settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFinancial = async () => {
        try {
            setSaving(true);
            const payload = {
                withdrawalFee: Number(financialSettings.withdrawalFee),
                minWithdrawal: Number(financialSettings.minWithdrawal),
                minRecharge: Number(financialSettings.minRecharge),
                principalTax: Number(financialSettings.principalTax),
            };
            await SettingsService.updateSettings(SETTINGS_KEYS.FINANCIAL, payload);
            setIsEditingFinancial(false);
        } catch (error) {
            console.error('Failed to save financial settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelReferral = () => {
        setIsEditingReferral(false);
        fetchSettings();
    };

    const handleCancelFinancial = () => {
        setIsEditingFinancial(false);
        fetchSettings();
    };

    const addReferralLevel = () => {
        setReferralSettings((prev) => ({
            levels: [
                ...prev.levels,
                { level: prev.levels.length + 1, percentage: 0 }
            ]
        }));
    };

    const removeReferralLevel = (index: number) => {
        setReferralSettings((prev) => ({
            levels: prev.levels.filter((_, i) => i !== index)
        }));
    };

    const updateReferralLevel = (index: number, field: keyof ReferralLevelConfigForm, value: string | number) => {
        const newLevels = [...referralSettings.levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setReferralSettings({ levels: newLevels });
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="settings-page-header">
                <div>
                    <h1>System Settings</h1>
                    <p className="text-muted">Manage application configuration and parameters</p>
                </div>
            </div>


            {/* Referral Configuration */}
            <div className="card mb-6">
                <div className="card-header flex justify-between items-center">
                    <div>
                        <h3>Multi-Level Referral Configuration</h3>
                        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>
                            Configure commission percentages for each referral level
                        </p>
                    </div>
                    {!isEditingReferral ? (
                        <button className="btn btn-secondary" onClick={() => setIsEditingReferral(true)}>
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button className="btn btn-secondary" onClick={handleCancelReferral}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveReferral} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Level</th>
                                <th style={{ width: '55%' }}>Commission Percentage</th>
                                {isEditingReferral && <th style={{ width: '20%' }} className="align-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {referralSettings.levels.length === 0 && (
                                <tr>
                                    <td colSpan={isEditingReferral ? 3 : 2} className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>
                                        No referral levels configured.
                                    </td>
                                </tr>
                            )}
                            {referralSettings.levels.map((level, index) => (
                                <tr key={index}>
                                    <td>
                                        Level {index + 1}
                                    </td>
                                    <td>
                                        {isEditingReferral ? (
                                            <div className="percent-input-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-input percent-input"
                                                    value={level.percentage}
                                                    onChange={(e) => updateReferralLevel(index, 'percentage', e.target.value)}
                                                    step="0.1"
                                                    min="0"
                                                />
                                                <span className="percent-symbol">%</span>
                                            </div>
                                        ) : (
                                            <span>{level.percentage}%</span>
                                        )}
                                    </td>
                                    {isEditingReferral && (
                                        <td className="align-center">
                                            <button
                                                className="btn-trash"
                                                onClick={() => removeReferralLevel(index)}
                                                title="Remove"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isEditingReferral && (
                    <div className="card-footer" style={{ background: 'var(--color-surface)' }}>
                        <button className="btn btn-secondary" onClick={addReferralLevel}>
                            <PlusIcon /> Add Level
                        </button>
                    </div>
                )}
            </div>

            {/* Financial Configuration */}
            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <div>
                        <h3>Financial Parameters</h3>
                        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>
                            Set global limits and fees for transactions
                        </p>
                    </div>
                    {!isEditingFinancial ? (
                        <button className="btn btn-secondary" onClick={() => setIsEditingFinancial(true)}>
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button className="btn btn-secondary" onClick={handleCancelFinancial}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveFinancial} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
                <div className="card-body">
                    <div className="settings-grid">
                        <div className="form-group">
                            <label className="form-label">Minimum Recharge Amount</label>
                            <div className="input-group">
                                <span className="input-prefix">$</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={financialSettings.minRecharge}
                                    onChange={(e) => setFinancialSettings({ ...financialSettings, minRecharge: e.target.value })}
                                    disabled={!isEditingFinancial}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Minimum Withdrawal Amount</label>
                            <div className="input-group">
                                <span className="input-prefix">$</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={financialSettings.minWithdrawal}
                                    onChange={(e) => setFinancialSettings({ ...financialSettings, minWithdrawal: e.target.value })}
                                    disabled={!isEditingFinancial}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Withdrawal Fee Amount</label>
                            <div className="input-group">
                                <span className="input-prefix">USDT</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={financialSettings.withdrawalFee}
                                    onChange={(e) => setFinancialSettings({ ...financialSettings, withdrawalFee: e.target.value })}
                                    step="0.01"
                                    disabled={!isEditingFinancial}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Principal Return Tax</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-input"
                                    value={financialSettings.principalTax}
                                    onChange={(e) => setFinancialSettings({ ...financialSettings, principalTax: e.target.value })}
                                    step="0.01"
                                    disabled={!isEditingFinancial}
                                />
                                <span className="input-suffix">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
