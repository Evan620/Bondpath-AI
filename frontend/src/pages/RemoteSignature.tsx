import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SignaturePad from '../components/advisor/SignaturePad';
import { Check, AlertCircle, FileText, Scale } from 'lucide-react';

interface SignaturePageData {
    case_id: string;
    defendant_name: string;
    bond_amount: number;
    advisor_name: string;
    expires_at: string;
}

export default function RemoteSignature() {
    const { token } = useParams<{ token: string }>();


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageData, setPageData] = useState<SignaturePageData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Signature states
    const [termsSignature, setTermsSignature] = useState('');
    const [feeDisclosureSignature, setFeeDisclosureSignature] = useState('');
    const [contactAgreementSignature, setContactAgreementSignature] = useState('');
    const [indemnitorSignature, setIndemnitorSignature] = useState('');
    const [indemnitorPrintedName, setIndemnitorPrintedName] = useState('');
    const [indemnitorSignatureDate, setIndemnitorSignatureDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        loadPageData();
    }, [token]);

    const loadPageData = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/signature/public/signature/${token}`);
            setPageData(response.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load signature page');
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validate required signatures
        if (!termsSignature || !feeDisclosureSignature || !contactAgreementSignature || !indemnitorSignature) {
            setError('Please complete all required signatures');
            return;
        }

        if (!indemnitorPrintedName) {
            setError('Please enter your printed name');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await axios.post(`http://localhost:8000/signature/public/signature/${token}/submit`, {
                terms_signature: termsSignature,
                fee_disclosure_signature: feeDisclosureSignature,
                contact_agreement_signature: contactAgreementSignature,
                indemnitor_signature: indemnitorSignature,
                indemnitor_printed_name: indemnitorPrintedName,
                indemnitor_signature_date: indemnitorSignatureDate
            });

            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit signatures');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (error && !pageData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-xl font-bold">Error</h2>
                    </div>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Signatures Submitted!</h2>
                    <p className="text-slate-600">
                        Thank you for completing the bail bond agreement. Your advisor will be notified.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Bail Bond Agreement</h1>
                    <p className="text-slate-600 mb-4">Please review and sign the following documents</p>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 font-medium">Defendant:</span>
                                <div className="font-bold text-slate-900">{pageData?.defendant_name}</div>
                            </div>
                            <div>
                                <span className="text-slate-500 font-medium">Bond Amount:</span>
                                <div className="font-bold text-slate-900">${pageData?.bond_amount.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Terms & Conditions */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Terms & Conditions
                    </h3>
                    <div className="prose prose-sm text-slate-600 mb-4 max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100 h-32 overflow-y-auto">
                        <p>I understand and agree to the terms and conditions of the bail bond agreement...</p>
                        <p className="mt-2">By signing below, I acknowledge receipt of the full Terms and Conditions document.</p>
                    </div>
                    <SignaturePad
                        label="Your Signature - Terms"
                        value={termsSignature}
                        onChange={setTermsSignature}
                    />
                </div>

                {/* Fee Disclosure */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Fee Disclosure
                    </h3>
                    <div className="mb-4 text-sm text-slate-600">
                        <p>I verify that I have been informed that the premium for this bond is <strong>${(pageData?.bond_amount ? pageData.bond_amount * 0.1 : 0).toFixed(2)}</strong> (10% of bond amount).</p>
                    </div>
                    <SignaturePad
                        label="Your Signature - Fees"
                        value={feeDisclosureSignature}
                        onChange={setFeeDisclosureSignature}
                    />
                </div>

                {/* Contact Agreement */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Defendant Contact Agreement</h3>
                    <SignaturePad
                        label="Your Signature - Contact Agreement"
                        value={contactAgreementSignature}
                        onChange={setContactAgreementSignature}
                    />
                </div>

                {/* Final Authorization */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Final Authorization</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Printed Name *</label>
                            <input
                                value={indemnitorPrintedName}
                                onChange={(e) => setIndemnitorPrintedName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Full Legal Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                            <input
                                type="date"
                                value={indemnitorSignatureDate}
                                onChange={(e) => setIndemnitorSignatureDate(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <SignaturePad
                        label="Official Signature"
                        value={indemnitorSignature}
                        onChange={setIndemnitorSignature}
                        date={indemnitorSignatureDate}
                    />
                </div>

                {/* Submit Button */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Submit All Signatures
                            </>
                        )}
                    </button>
                    <p className="text-center text-sm text-slate-500 mt-3">
                        By submitting, you agree to all terms and conditions
                    </p>
                </div>
            </div>
        </div>
    );
}
