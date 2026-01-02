import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiClient as api } from '../../api/client';
import { Check, ChevronRight, DollarSign, FileText, History, PenTool, Scale, User, X, ChevronDown, ArrowLeft, Upload, AlertTriangle, ScanEye } from 'lucide-react';
import SignaturePad from './SignaturePad';
import FileUpload from './FileUpload';

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    bond_amount: number;
    jail_facility: string;
    // CST Intake Fields
    defendant_dob?: string;
    defendant_gender?: string;
    county?: string;
    state_jurisdiction?: string;
    booking_number?: string;
    bond_type?: string;
    charge_severity?: string;
    caller_name?: string;
    caller_relationship?: string;
    caller_phone?: string;
    caller_email?: string;
    intent_signal?: string;
    fast_flags?: string[];
    // Advisor fields
    engagement_type?: string;
    premium_type?: string;
    down_payment_amount?: number;
    monthly_payment_amount?: number;
    payment_method?: string;
    collateral_description?: string;
    has_collateral?: string;
    indemnitor_first_name?: string;
    indemnitor_last_name?: string;
    indemnitor_phone?: string;
    indemnitor_email?: string;
    indemnitor_address?: string;
    indemnitor_relationship?: string;
    defendant_ssn_last4?: string;
    charges?: string;
    advisor_notes?: string;
    assigned_to?: string;
    // Remote Acknowedgment
    contact_method?: string;
    remote_acknowledgment_sent?: string;
    client_email_for_remote?: string;
    // Signatures
    terms_signature?: string;
    fee_disclosure_signature?: string;
    contact_agreement_signature?: string;
    indemnitor_signature?: string;
    indemnitor_printed_name?: string;
    indemnitor_signature_date?: string;
    co_signer_name?: string;
    co_signer_phone?: string;
    co_signer_signature?: string;
    deferred_payment_auth_signature?: string;
    // Documents
    booking_sheet_url?: string;
    defendant_id_url?: string;
    indemnitor_id_url?: string;
    gov_id_url?: string;
    collateral_doc_url?: string;
}

interface Underwriter {
    id: string;
    email: string;
    active_cases: number;
}

const PROCEED_STEPS = [
    { id: 'engagement', title: 'Engagement' },
    { id: 'financials', title: 'Financials' },
    { id: 'parties', title: 'Parties' },
    { id: 'agreement', title: 'Agreement' },
    { id: 'docs', title: 'Documents' },
    { id: 'review', title: 'Review & Assign' }
];

const QUOTE_STEPS = [
    { id: 'engagement', title: 'Engagement' },
    { id: 'financials', title: 'Financials' },
    { id: 'quote_summary', title: 'Quote Summary' }
];

export default function AdvisorCaseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [underwriters, setUnderwriters] = useState<Underwriter[]>([]);
    const [selectedUnderwriter, setSelectedUnderwriter] = useState('');

    // Form state
    const [engagementType, setEngagementType] = useState('PROCEED_NOW');
    const activeSteps = engagementType === 'QUOTE_ONLY' ? QUOTE_STEPS : PROCEED_STEPS;
    const [premiumType, setPremiumType] = useState('FULL_PREMIUM');
    const [downPayment, setDownPayment] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [collateralDesc, setCollateralDesc] = useState('');
    const [hasCollateral, setHasCollateral] = useState('YES');
    const [indemnitorFirstName, setIndemnitorFirstName] = useState('');
    const [indemnitorLastName, setIndemnitorLastName] = useState('');
    const [indemnitorPhone, setIndemnitorPhone] = useState('');
    const [indemnitorEmail, setIndemnitorEmail] = useState('');
    const [indemnitorAddress, setIndemnitorAddress] = useState('');
    const [indemnitorRelationship, setIndemnitorRelationship] = useState('');
    const [ssnLast4, setSsnLast4] = useState('');
    const [charges, setCharges] = useState('');
    const [advisorNotes, setAdvisorNotes] = useState('');
    const [showIntakeInfo, setShowIntakeInfo] = useState(false);

    // Remote Acknowledgment State
    const [contactMethod, setContactMethod] = useState('IN_PERSON');
    const [remoteAckSent, setRemoteAckSent] = useState('NO');
    const [clientEmailForRemote, setClientEmailForRemote] = useState('');

    // Agreement State
    const [termsSignature, setTermsSignature] = useState('');
    const [feeDisclosureSignature, setFeeDisclosureSignature] = useState('');
    const [contactAgreementSignature, setContactAgreementSignature] = useState('');
    const [indemnitorSignature, setIndemnitorSignature] = useState('');
    const [indemnitorPrintedName, setIndemnitorPrintedName] = useState('');
    const [indemnitorSignatureDate, setIndemnitorSignatureDate] = useState(new Date().toISOString().split('T')[0]);
    const [coSignerName, setCoSignerName] = useState('');
    const [coSignerPhone, setCoSignerPhone] = useState('');
    const [coSignerSignature, setCoSignerSignature] = useState('');
    const [deferredPaymentAuthSignature, setDeferredPaymentAuthSignature] = useState('');
    const [agreementSubStep, setAgreementSubStep] = useState(0);
    const [docSubStep, setDocSubStep] = useState(0);
    const [financialSubStep, setFinancialSubStep] = useState(0);
    const [partiesSubStep, setPartiesSubStep] = useState(0);

    // Document State
    const [bookingSheetUrl, setBookingSheetUrl] = useState('');
    const [defendantIdUrl, setDefendantIdUrl] = useState('');
    const [indemnitorIdUrl, setIndemnitorIdUrl] = useState('');
    const [govIdUrl, setGovIdUrl] = useState('');
    const [collateralDocUrl, setCollateralDocUrl] = useState('');

    // AI Agent State
    const [aiChecking, setAiChecking] = useState(false);
    const [readinessResult, setReadinessResult] = useState<{
        ready_for_submission: boolean;
        confidence_score: number;
        blockers: string[];
        warnings: string[];
        quality_notes?: string;
    } | null>(null);

    const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null);
    const [docVerificationResults, setDocVerificationResults] = useState<Record<string, {
        match_status: string;
        mismatches: string[];
        confidence_score: number;
    }>>({});

    // Derived state for read-only mode
    const isReadOnly = caseData ? ['UNDERWRITING_REVIEW', 'APPROVED', 'DECLINED'].includes(caseData.state) : false;
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCase();
        fetchUnderwriters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCase = async () => {
        try {
            const response = await api.get(`/cases/${id}`);
            const data = response.data;
            setCaseData(data);

            // Pre-fill form if data exists
            if (data.engagement_type) setEngagementType(data.engagement_type);
            if (data.premium_type) setPremiumType(data.premium_type);
            if (data.down_payment_amount) setDownPayment(data.down_payment_amount.toString());
            if (data.monthly_payment_amount) setMonthlyPayment(data.monthly_payment_amount.toString());
            if (data.payment_method) setPaymentMethod(data.payment_method);
            if (data.collateral_description) setCollateralDesc(data.collateral_description);
            if (data.has_collateral) setHasCollateral(data.has_collateral);
            if (data.indemnitor_first_name) setIndemnitorFirstName(data.indemnitor_first_name);
            if (data.indemnitor_last_name) setIndemnitorLastName(data.indemnitor_last_name);
            if (data.indemnitor_phone) setIndemnitorPhone(data.indemnitor_phone);
            if (data.indemnitor_email) setIndemnitorEmail(data.indemnitor_email);
            if (data.indemnitor_address) setIndemnitorAddress(data.indemnitor_address);
            if (data.indemnitor_relationship) setIndemnitorRelationship(data.indemnitor_relationship);
            if (data.defendant_ssn_last4) setSsnLast4(data.defendant_ssn_last4);
            if (data.charges) setCharges(data.charges);
            if (data.advisor_notes) setAdvisorNotes(data.advisor_notes);
            if (data.contact_method) setContactMethod(data.contact_method);
            if (data.remote_acknowledgment_sent) setRemoteAckSent(data.remote_acknowledgment_sent);
            if (data.client_email_for_remote) setClientEmailForRemote(data.client_email_for_remote || data.caller_email || '');
            if (data.terms_signature) setTermsSignature(data.terms_signature);
            if (data.fee_disclosure_signature) setFeeDisclosureSignature(data.fee_disclosure_signature);
            if (data.contact_agreement_signature) setContactAgreementSignature(data.contact_agreement_signature);
            if (data.indemnitor_signature) setIndemnitorSignature(data.indemnitor_signature);
            if (data.indemnitor_printed_name) setIndemnitorPrintedName(data.indemnitor_printed_name);
            if (data.indemnitor_signature_date) setIndemnitorSignatureDate(data.indemnitor_signature_date);
            if (data.co_signer_name) setCoSignerName(data.co_signer_name);
            if (data.co_signer_phone) setCoSignerPhone(data.co_signer_phone);
            if (data.co_signer_signature) setCoSignerSignature(data.co_signer_signature);
            if (data.deferred_payment_auth_signature) setDeferredPaymentAuthSignature(data.deferred_payment_auth_signature);

            if (data.booking_sheet_url) setBookingSheetUrl(data.booking_sheet_url);
            if (data.defendant_id_url) setDefendantIdUrl(data.defendant_id_url);
            if (data.indemnitor_id_url) setIndemnitorIdUrl(data.indemnitor_id_url);
            if (data.gov_id_url) setGovIdUrl(data.gov_id_url);
            if (data.collateral_doc_url) setCollateralDocUrl(data.collateral_doc_url);

            // Should pre-fill client email from caller if not set
            if (!data.client_email_for_remote && data.caller_email) {
                setClientEmailForRemote(data.caller_email);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch case:', error);
            setLoading(false);
        }
    };

    const fetchUnderwriters = async () => {
        try {
            const response = await api.get('/users/underwriters');
            setUnderwriters(response.data);
        } catch (error) {
            console.error('Failed to fetch underwriters:', error);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await saveData('ADVISOR_ACTIVE');
            alert('Draft saved successfully');
        } catch (error) {
            console.error('Failed to save draft:', error);
            alert('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitToUnderwriter = async () => {
        // Validation - Basic only
        const errors = [];
        if (engagementType === 'PROCEED_NOW') {
            // Documents are now optional/lazy loaded based on user request
        }

        if (!selectedUnderwriter) errors.push('Please select an underwriter.');

        if (errors.length > 0) {
            alert('Missing Requirements:\n' + errors.join('\n'));
            return;
        }

        setSaving(true);
        try {
            await saveData('UNDERWRITING_REVIEW', selectedUnderwriter);
            navigate('/advisor'); // Go back to advisor dashboard after submission
        } catch (error) {
            console.error('Failed to submit case:', error);
            alert('Failed to submit case');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: File, type: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', type);

        try {
            const response = await api.post(`/cases/${id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local state with URL
            if (type === 'booking_sheet') setBookingSheetUrl(response.data.url);
            else if (type === 'defendant_id') setDefendantIdUrl(response.data.url);
            else if (type === 'indemnitor_id') setIndemnitorIdUrl(response.data.url);
            else if (type === 'gov_id') setGovIdUrl(response.data.url);
            else if (type === 'collateral_doc') setCollateralDocUrl(response.data.url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        }
    };

    const handleCheckReadiness = async () => {
        setAiChecking(true);
        setReadinessResult(null);
        try {
            const response = await api.post(`/agents/readiness/${id}`);
            setReadinessResult(response.data);
        } catch (error) {
            console.error('AI Check failed:', error);
            alert('AI Check failed. Please review manually.');
        } finally {
            setAiChecking(false);
        }
    };

    const handleVerifyDocument = async (docType: string, fileUrl: string) => {
        setVerifyingDoc(docType);
        try {
            const response = await api.post('/agents/verify-doc', {
                case_id: id,
                doc_type: docType,
                file_url: fileUrl
            });
            setDocVerificationResults(prev => ({
                ...prev,
                [docType]: response.data
            }));
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Document verification failed.');
        } finally {
            setVerifyingDoc(null);
        }
    };

    const saveData = async (state: string, assignedTo?: string) => {
        await api.patch(`/cases/${id}`, {
            engagement_type: engagementType,
            premium_type: premiumType,
            down_payment_amount: downPayment ? parseFloat(downPayment) : null,
            monthly_payment_amount: monthlyPayment ? parseFloat(monthlyPayment) : null,
            payment_method: paymentMethod,
            collateral_description: collateralDesc,
            has_collateral: hasCollateral,
            indemnitor_first_name: indemnitorFirstName,
            indemnitor_last_name: indemnitorLastName,
            indemnitor_phone: indemnitorPhone,
            indemnitor_email: indemnitorEmail,
            indemnitor_address: indemnitorAddress,
            indemnitor_relationship: indemnitorRelationship,
            defendant_ssn_last4: ssnLast4,
            charges: charges,
            advisor_notes: advisorNotes,
            state: state,
            assigned_to: assignedTo || caseData?.assigned_to, // Keep current owner if not reassigning
            contact_method: contactMethod,
            remote_acknowledgment_sent: remoteAckSent,
            client_email_for_remote: clientEmailForRemote,
            terms_signature: termsSignature,
            fee_disclosure_signature: feeDisclosureSignature,
            contact_agreement_signature: contactAgreementSignature,
            indemnitor_signature: indemnitorSignature,
            indemnitor_printed_name: indemnitorPrintedName,
            indemnitor_signature_date: indemnitorSignatureDate,
            co_signer_name: coSignerName,
            co_signer_phone: coSignerPhone,
            co_signer_signature: coSignerSignature,
            deferred_payment_auth_signature: deferredPaymentAuthSignature
        });
    };

    const renderSummary = () => (
        <div className="animate-fadeIn">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-bold text-slate-800">Application Summary</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Col 1: Engagement */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engagement</h4>
                        <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border w-fit ${engagementType === 'PROCEED_NOW'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                {engagementType === 'PROCEED_NOW' ? 'Proceeding Now' : 'Quote Only'}
                            </span>
                            {contactMethod === 'REMOTE' && (
                                <div className="text-sm">
                                    <div className={`flex items-center gap-1.5 font-bold ${remoteAckSent === 'YES' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {remoteAckSent === 'YES' ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        {remoteAckSent === 'YES' ? 'Remote Ack Sent' : 'Ack Pending'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]" title={clientEmailForRemote}>
                                        {clientEmailForRemote}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Col 2: Financials */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financials</h4>
                        <div className="text-sm space-y-2">
                            <div>
                                <div className="text-xs text-slate-500">Premium Type</div>
                                <div className="font-bold text-slate-900">{premiumType === 'FULL_PREMIUM' ? 'Full Premium' : 'Payment Plan'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Method</div>
                                <div className="font-bold text-slate-900">{paymentMethod}</div>
                            </div>
                            {premiumType === 'PAYMENT_PLAN' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-xs text-slate-500">Down</div>
                                        <div className="font-bold text-slate-900">${downPayment}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Monthly</div>
                                        <div className="font-bold text-slate-900">${monthlyPayment}</div>
                                    </div>
                                </div>
                            )}
                            {hasCollateral !== 'NO' && (
                                <div>
                                    <div className="text-xs text-slate-500">Collateral</div>
                                    <div className="text-xs font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-0.5 truncate">
                                        {collateralDesc || 'No desc'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Col 3: Indemnitor */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indemnitor</h4>
                        <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-sm">{indemnitorFirstName} {indemnitorLastName}</div>
                            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded w-fit">{indemnitorRelationship}</div>
                            <div className="text-xs text-slate-600 mt-2 block">{indemnitorPhone}</div>
                            <div className="text-xs text-slate-600 truncate block text-blue-600" title={indemnitorEmail}>{indemnitorEmail}</div>
                        </div>
                    </div>

                    {/* Col 4: Details & Notes */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Details</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-xs text-slate-500">SSN (Last 4): </span>
                                <span className="font-bold text-slate-900">{ssnLast4 || 'N/A'}</span>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-0.5">Charges</div>
                                <div className="text-xs bg-slate-50 p-1.5 rounded border border-slate-100 font-medium line-clamp-2" title={charges}>
                                    {charges || 'None'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Footer */}
                {advisorNotes && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                            <div className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap mt-0.5">Notes:</div>
                            <div className="text-sm text-slate-700 italic">
                                "{advisorNotes}"
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDocVerifier = (type: string, url: string) => {
        if (!url) return null;

        // Only show AI verification for image files (as requested)
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        if (!isImage) return null;

        const result = docVerificationResults[type];

        return (
            <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden transition-all">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ScanEye className="w-4 h-4 text-blue-600" />
                        <span>AI Verification</span>
                    </div>

                    {result ? (
                        <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold ${result.match_status === 'MATCH' ? 'bg-green-100 text-green-700' :
                            result.match_status === 'MISMATCH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {result.match_status === 'MATCH' && <Check className="w-3 h-3" />}
                            {result.match_status === 'MISMATCH' && <X className="w-3 h-3" />}
                            {result.match_status}
                        </div>
                    ) : (
                        <button
                            onClick={() => handleVerifyDocument(type, url)}
                            disabled={verifyingDoc === type}
                            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {verifyingDoc === type ? 'Scanning...' : 'Verify Document'}
                        </button>
                    )}
                </div>

                {result && result.mismatches && result.mismatches.length > 0 && (
                    <div className="p-3 bg-red-50 border-t border-slate-200">
                        <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Discrepancies Found:
                        </p>
                        <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                            {result.mismatches.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderStepContent = () => {
        const stepId = activeSteps[currentStep].id;

        switch (stepId) {
            case 'engagement':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <label className="block text-lg font-bold text-slate-800 mb-2">
                                Is the client ready to proceed?
                            </label>
                            <p className="text-slate-500 mb-6 font-medium">Determine if this is just a quote or an active application.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setEngagementType('PROCEED_NOW')}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${engagementType === 'PROCEED_NOW'
                                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`font-bold text-lg mb-2 flex items-center gap-2 ${engagementType === 'PROCEED_NOW' ? 'text-slate-900' : 'text-slate-600'
                                        }`}>
                                        <FileText className="w-5 h-5" />
                                        Proceed Now
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Start full application and verify details.</div>
                                </button>
                                <button
                                    onClick={() => setEngagementType('QUOTE_ONLY')}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${engagementType === 'QUOTE_ONLY'
                                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`font-bold text-lg mb-2 flex items-center gap-2 ${engagementType === 'QUOTE_ONLY' ? 'text-slate-900' : 'text-slate-600'
                                        }`}>
                                        <DollarSign className="w-5 h-5" />
                                        Quote Only
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Provide pricing information only.</div>
                                </button>
                            </div>
                        </div>


                    </div>

                );

            case 'financials':
                const financialSteps = [
                    { id: 'premium', title: 'Premium' },
                    { id: 'collateral', title: 'Collateral' }
                ];
                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Sub-step Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900 text-sm">Financials {financialSubStep + 1} of {financialSteps.length}</span>
                            </div>
                            <div className="flex gap-1">
                                {financialSteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 w-8 rounded-full transition-all ${idx <= financialSubStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {financialSubStep === 0 && (
                            <div className="space-y-8 animate-slideUp">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                        Premium & Payment
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Premium Type</label>
                                            <select
                                                value={premiumType}
                                                onChange={(e) => setPremiumType(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-medium text-slate-700"
                                            >
                                                <option value="FULL_PREMIUM">Full Premium</option>
                                                <option value="PAYMENT_PLAN">Payment Plan</option>
                                                <option value="DEFERRED">Deferred Payment</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-medium text-slate-700"
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="CARD">Credit/Debit Card</option>
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="MONEY_ORDER">Money Order</option>
                                                <option value="COLLATERAL">Collateral</option>
                                            </select>
                                        </div>
                                    </div>
                                    {premiumType === 'PAYMENT_PLAN' && (
                                        <div className="grid grid-cols-2 gap-6 mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Down Payment</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={downPayment}
                                                        onChange={(e) => setDownPayment(e.target.value)}
                                                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Payment</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={monthlyPayment}
                                                        onChange={(e) => setMonthlyPayment(e.target.value)}
                                                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {financialSubStep === 1 && (
                            <div className="animate-slideUp">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                    Collateral
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Is collateral required?</label>
                                        <div className="flex gap-4">
                                            {['YES', 'NO', 'UNSURE'].map((opt) => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value={opt}
                                                        checked={hasCollateral === opt}
                                                        onChange={(e) => setHasCollateral(e.target.value)}
                                                        className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                                                    />
                                                    <span className="text-slate-700 font-medium">{opt.charAt(0) + opt.slice(1).toLowerCase()}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                        <textarea
                                            value={collateralDesc}
                                            onChange={(e) => setCollateralDesc(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="Describe collateral property or items..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'parties':
                const partySteps = [
                    { id: 'indem_basic', title: 'Indemnitor Basic' },
                    { id: 'indem_contact', title: 'Indemnitor Contact' },
                    { id: 'defendant', title: 'Defendant Details' }
                ];
                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Sub-step Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900 text-sm">Parties {partiesSubStep + 1} of {partySteps.length}</span>
                            </div>
                            <div className="flex gap-1">
                                {partySteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 w-8 rounded-full transition-all ${idx <= partiesSubStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {partiesSubStep === 0 && (
                            <div className="animate-slideUp">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                    Indemnitor Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                        <input
                                            value={indemnitorFirstName}
                                            onChange={(e) => setIndemnitorFirstName(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                        <input
                                            value={indemnitorLastName}
                                            onChange={(e) => setIndemnitorLastName(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="Last Name"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship to Defendant</label>
                                        <select
                                            value={indemnitorRelationship}
                                            onChange={(e) => setIndemnitorRelationship(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                                        >
                                            <option value="">Select Relationship...</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Friend">Friend</option>
                                            <option value="Employer">Employer</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {partiesSubStep === 1 && (
                            <div className="animate-slideUp">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                    Indemnitor Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                        <input
                                            value={indemnitorPhone}
                                            onChange={(e) => setIndemnitorPhone(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="(555) 555-5555"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                        <input
                                            value={indemnitorEmail}
                                            onChange={(e) => setIndemnitorEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                                        <input
                                            value={indemnitorAddress}
                                            onChange={(e) => setIndemnitorAddress(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="Full Address"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {partiesSubStep === 2 && (
                            <div className="animate-slideUp">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                    Additional Details
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Defendant SSN (Last 4)</label>
                                        <input
                                            value={ssnLast4}
                                            onChange={(e) => setSsnLast4(e.target.value)}
                                            maxLength={4}
                                            className="w-32 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-center font-bold tracking-widest"
                                            placeholder="0000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Charges</label>
                                        <textarea
                                            value={charges}
                                            onChange={(e) => setCharges(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="List charges..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'agreement':
                const agreementSteps = [
                    { id: 'method', title: 'Agreement Method', counter: '00' },
                    ...(contactMethod === 'REMOTE' ? [] : [
                        { id: 'terms', title: 'Terms & Conditions', counter: '01' },
                        { id: 'fees', title: 'Fee Disclosure', counter: '02' },
                        { id: 'contact', title: 'Defendant Contact Agreement', counter: '03' },
                        ...(premiumType === 'DEFERRED' ? [{ id: 'deferred', title: 'Deferred Payment Authorization', counter: '04' }] : []),
                        { id: 'final', title: 'Indemnitor Signature', counter: premiumType === 'DEFERRED' ? '05' : '04' },
                        { id: 'cosigner', title: 'Co-Signer (Optional)', counter: premiumType === 'DEFERRED' ? '06' : '05' }
                    ])
                ];

                const currentSubStep = agreementSteps[agreementSubStep];
                if (!currentSubStep) return null;

                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Sub-step Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                                <Scale className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900 text-sm">Agreement {agreementSubStep + 1} of {agreementSteps.length}</span>
                            </div>
                            <div className="flex gap-1">
                                {agreementSteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 w-8 rounded-full transition-all ${idx <= agreementSubStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            {/* Agreement Method Selection */}
                            {currentSubStep.id === 'method' && (
                                <div className="space-y-8 animate-slideUp">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">How will agreements be signed?</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setContactMethod('IN_PERSON')}
                                            className={`p-6 border-2 rounded-xl text-left transition-all ${contactMethod === 'IN_PERSON'
                                                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`font-bold text-lg mb-2 flex items-center gap-2 ${contactMethod === 'IN_PERSON' ? 'text-slate-900' : 'text-slate-600'}`}>
                                                <PenTool className="w-5 h-5" />
                                                In Person
                                            </div>
                                            <div className="text-sm text-slate-500 font-medium">Sign now on this device</div>
                                        </button>
                                        <button
                                            onClick={() => setContactMethod('REMOTE')}
                                            className={`p-6 border-2 rounded-xl text-left transition-all ${contactMethod === 'REMOTE'
                                                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`font-bold text-lg mb-2 flex items-center gap-2 ${contactMethod === 'REMOTE' ? 'text-slate-900' : 'text-slate-600'}`}>
                                                <Upload className="w-5 h-5" />
                                                Remote
                                            </div>
                                            <div className="text-sm text-slate-500 font-medium">Email link to signer</div>
                                        </button>
                                    </div>

                                    {contactMethod === 'REMOTE' && (
                                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-fadeIn mt-6">
                                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                                Remote Client Acknowledgment
                                            </h4>

                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-blue-700 mb-2">Client Email</label>
                                                <input
                                                    value={clientEmailForRemote}
                                                    onChange={(e) => setClientEmailForRemote(e.target.value)}
                                                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="client@example.com"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-blue-200">
                                                <div>
                                                    <div className="font-bold text-slate-900">Send Request</div>
                                                    <div className="text-sm text-slate-500">Required for remote underwriting</div>
                                                </div>
                                                {remoteAckSent === 'YES' ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                        <Check className="w-5 h-5" />
                                                        Sent
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            if (!clientEmailForRemote) return alert('Please enter an email');
                                                            try {
                                                                await api.post(`/signature/cases/${id}/send-remote-signature`, {
                                                                    email: clientEmailForRemote
                                                                });
                                                                setRemoteAckSent('YES');
                                                                alert('Signature request sent successfully!');
                                                            } catch (error) {
                                                                console.error('Failed to send signature request:', error);
                                                                alert('Failed to send signature request. Please try again.');
                                                            }
                                                        }}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Send Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Terms & Conditions */}
                            {currentSubStep.id === 'terms' && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 animate-slideUp">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="bg-slate-100 p-2 rounded-lg text-slate-500 text-sm font-black">01</span>
                                        Terms & Conditions
                                    </h3>
                                    <div className="prose prose-sm text-slate-500 mb-4 max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100 h-32 overflow-y-auto">
                                        <p>I understand and agree to the terms and conditions of the bail bond agreement...</p>
                                        <p className="mt-2">By signing below, I acknowledge receipt of the full Terms and Conditions document.</p>
                                    </div>
                                    <SignaturePad
                                        label="Indemnitor Signature - Terms"
                                        value={termsSignature}
                                        onChange={setTermsSignature}
                                        date={new Date().toLocaleDateString()}
                                    />
                                </div>
                            )}

                            {/* Fee Disclosure */}
                            {currentSubStep.id === 'fees' && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 animate-slideUp">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="bg-slate-100 p-2 rounded-lg text-slate-500 text-sm font-black">02</span>
                                        Fee Disclosure
                                    </h3>
                                    <div className="mb-4 text-sm text-slate-600">
                                        <p>I verify that I have been informed that the premium for this bond is <strong>${caseData?.bond_amount ? (caseData.bond_amount * 0.1).toFixed(2) : '0.00'}</strong> (10% of bond amount).</p>
                                    </div>
                                    <SignaturePad
                                        label="Indemnitor Signature - Fees"
                                        value={feeDisclosureSignature}
                                        onChange={setFeeDisclosureSignature}
                                    />
                                </div>
                            )}

                            {/* Defendant Contact Agreement */}
                            {currentSubStep.id === 'contact' && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 animate-slideUp">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="bg-slate-100 p-2 rounded-lg text-slate-500 text-sm font-black">03</span>
                                        Defendant Contact Agreement
                                    </h3>
                                    <SignaturePad
                                        label="Indemnitor Signature - Contact Agmt"
                                        value={contactAgreementSignature}
                                        onChange={setContactAgreementSignature}
                                    />
                                </div>
                            )}

                            {/* Main Indemnitor Signature */}
                            {currentSubStep.id === 'final' && (
                                <div className="animate-slideUp">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <PenTool className="w-5 h-5 text-slate-700" />
                                            Indemnitor Signature
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Printed Name</label>
                                                <input
                                                    value={indemnitorPrintedName}
                                                    onChange={(e) => setIndemnitorPrintedName(e.target.value)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                                                    placeholder="Full Legal Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                                                <input
                                                    type="date"
                                                    value={indemnitorSignatureDate}
                                                    onChange={(e) => setIndemnitorSignatureDate(e.target.value)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                                                />
                                            </div>
                                        </div>

                                        <SignaturePad
                                            label="Indemnitor Official Signature"
                                            value={indemnitorSignature}
                                            onChange={setIndemnitorSignature}
                                            date={indemnitorSignatureDate}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Co-Signer (Optional) */}
                            {currentSubStep.id === 'cosigner' && (
                                <div className="animate-slideUp">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Co-Signer (Optional)</h3>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <input
                                                placeholder="Co-Signer Name"
                                                value={coSignerName}
                                                onChange={e => setCoSignerName(e.target.value)}
                                                className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            />
                                            <input
                                                placeholder="Co-Signer Phone"
                                                value={coSignerPhone}
                                                onChange={e => setCoSignerPhone(e.target.value)}
                                                className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                        <SignaturePad
                                            label="Co-Signer Signature"
                                            value={coSignerSignature}
                                            onChange={setCoSignerSignature}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Deferred Payment Authorization (Conditional) */}
                            {currentSubStep.id === 'deferred' && premiumType === 'DEFERRED' && (
                                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 relative overflow-hidden animate-slideUp">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <DollarSign className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                                        Deferred Payment Authorization
                                    </h3>
                                    <p className="text-sm text-amber-800 mb-6 font-medium">
                                        Required because premium payment is deferred. I authorize future charges according to the payment schedule.
                                    </p>
                                    <SignaturePad
                                        label="Signature for Deferred Payment"
                                        value={deferredPaymentAuthSignature}
                                        onChange={setDeferredPaymentAuthSignature}
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                );

            case 'docs':
                const docSteps = [
                    { id: 'booking', title: 'Booking Sheet' },
                    { id: 'defendant_id', title: 'Defendant ID' },
                    { id: 'indemnitor_id', title: 'Indemnitor ID' },
                    { id: 'gov_id', title: 'Government ID / SSN' },
                    ...(hasCollateral !== 'NO' ? [{ id: 'collateral', title: 'Collateral Docs' }] : [])
                ];

                const currentDocStep = docSteps[docSubStep];
                if (!currentDocStep) return null;

                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Sub-step Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900 text-sm">Document {docSubStep + 1} of {docSteps.length}</span>
                            </div>
                            <div className="flex gap-1">
                                {docSteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 w-8 rounded-full transition-all ${idx <= docSubStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            {currentDocStep.id === 'booking' && (
                                <div className="animate-slideUp">
                                    <FileUpload
                                        label="Booking Sheet"
                                        description="Official booking record from jail"
                                        value={bookingSheetUrl}
                                        onFileSelect={(f) => handleFileUpload(f, 'booking_sheet')}
                                        onClear={() => setBookingSheetUrl('')}
                                    />
                                    {renderDocVerifier('booking_sheet', bookingSheetUrl)}
                                </div>
                            )}

                            {currentDocStep.id === 'defendant_id' && (
                                <div className="animate-slideUp">
                                    <FileUpload
                                        label="Defendant ID"
                                        description="Driver's License or ID Card"
                                        value={defendantIdUrl}
                                        onFileSelect={(f) => handleFileUpload(f, 'defendant_id')}
                                        onClear={() => setDefendantIdUrl('')}
                                    />
                                    {renderDocVerifier('defendant_id', defendantIdUrl)}
                                </div>
                            )}

                            {currentDocStep.id === 'indemnitor_id' && (
                                <div className="animate-slideUp">
                                    <FileUpload
                                        label="Indemnitor ID"
                                        description="Driver's License or ID Card"
                                        value={indemnitorIdUrl}
                                        onFileSelect={(f) => handleFileUpload(f, 'indemnitor_id')}
                                        onClear={() => setIndemnitorIdUrl('')}
                                    />
                                    {renderDocVerifier('indemnitor_id', indemnitorIdUrl)}
                                </div>
                            )}

                            {currentDocStep.id === 'gov_id' && (
                                <div className="animate-slideUp">
                                    <FileUpload
                                        label="Government ID / SSN Card"
                                        value={govIdUrl}
                                        onFileSelect={(f) => handleFileUpload(f, 'gov_id')}
                                        onClear={() => setGovIdUrl('')}
                                    />
                                    {renderDocVerifier('gov_id', govIdUrl)}
                                </div>
                            )}

                            {currentDocStep.id === 'collateral' && hasCollateral !== 'NO' && (
                                <div className="animate-slideUp">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                                        Collateral Documentation
                                    </h3>
                                    <FileUpload
                                        label="Collateral Deed / Title"
                                        description="Proof of ownership for collateral"
                                        value={collateralDocUrl}
                                        onFileSelect={(f) => handleFileUpload(f, 'collateral_doc')}
                                        onClear={() => setCollateralDocUrl('')}
                                    />
                                    {renderDocVerifier('collateral_doc', collateralDocUrl)}
                                </div>
                            )}
                        </div>
                    </div>
                ); case 'quote_summary':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 text-lg">Quote Summary</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                    <div className="text-slate-500 text-sm uppercase tracking-wide font-bold mb-1">Total Bond</div>
                                    <div className="text-2xl font-bold text-slate-900">${caseData?.bond_amount ? caseData.bond_amount.toLocaleString() : '0.00'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="text-slate-500 text-sm font-medium">Premium Type</div>
                                        <div className="text-lg font-semibold text-slate-800">{premiumType === 'FULL_PREMIUM' ? 'Full Premium' : 'Payment Plan'}</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="text-slate-500 text-sm font-medium">Payment Method</div>
                                        <div className="text-lg font-semibold text-slate-800">{paymentMethod}</div>
                                    </div>
                                </div>
                                {collateralDesc && (
                                    <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="text-slate-500 text-sm font-medium">Collateral</div>
                                        <div className="text-lg font-semibold text-slate-800">{collateralDesc}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                            <p className="text-yellow-800 font-medium flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Quote saved. Client not creating application yet.
                            </p>
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 text-lg">Application Summary</h3>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div className="text-slate-500 font-medium">Defendant</div>
                                <div className="font-bold text-slate-900">{caseData?.defendant_first_name} {caseData?.defendant_last_name}</div>
                                <div className="text-slate-500 font-medium">Premium</div>
                                <div className="font-bold text-slate-900">{premiumType} via {paymentMethod}</div>
                                <div className="text-slate-500 font-medium">Indemnitor</div>
                                <div className="font-bold text-slate-900">{indemnitorFirstName} {indemnitorLastName}</div>
                            </div>
                        </div>

                        {/* AI Readiness Check */}
                        {/* Submission Quality Audit (Redesigned) */}
                        <div className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                                        Submission Quality Audit
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Automated risk & data completeness check</p>
                                </div>
                                <button
                                    onClick={handleCheckReadiness}
                                    disabled={aiChecking}
                                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {aiChecking ? 'Running Audit...' : 'Run Audit'}
                                </button>
                            </div>

                            {!readinessResult && !aiChecking && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Click "Run Audit" to verify case details before submission.
                                </div>
                            )}

                            {aiChecking && (
                                <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Analyzing Case Data...</span>
                                </div>
                            )}

                            {readinessResult && (
                                <div className="p-6">
                                    <div className="flex items-start gap-6">
                                        {/* Score Badge */}
                                        <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${readinessResult.ready_for_submission ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'
                                            }`}>
                                            <span className="text-2xl font-black">{readinessResult.confidence_score}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {/* Status Header */}
                                            <div>
                                                <div className={`text-lg font-bold ${readinessResult.ready_for_submission ? 'text-green-700' : 'text-amber-700'}`}>
                                                    {readinessResult.ready_for_submission ? 'Ready for Submission' : 'Attention Needed'}
                                                </div>
                                                <div className="text-slate-500 text-sm">
                                                    {readinessResult.quality_notes || "No additional quality notes."}
                                                </div>
                                            </div>

                                            {/* Issues List */}
                                            {(readinessResult.blockers.length > 0 || readinessResult.warnings.length > 0) && (
                                                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    {readinessResult.blockers.map((b, i) => (
                                                        <div key={`b-${i}`} className="flex gap-2 text-sm text-red-600 font-medium items-start">
                                                            <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-red-500"></div>
                                                            {b}
                                                        </div>
                                                    ))}
                                                    {readinessResult.warnings.map((w, i) => (
                                                        <div key={`w-${i}`} className="flex gap-2 text-sm text-amber-600 font-medium items-start">
                                                            <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-500"></div>
                                                            {w}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notes to Underwriter</label>
                                <textarea
                                    value={advisorNotes}
                                    onChange={(e) => setAdvisorNotes(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm resize-none shadow-sm"
                                    placeholder="Add context or specific requests..."
                                />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    Assign Underwriter
                                </h3>
                                <div className="space-y-2">
                                    {underwriters.map((uw) => (
                                        <div
                                            key={uw.id}
                                            onClick={() => setSelectedUnderwriter(uw.id)}
                                            className={`px-3 py-2.5 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${selectedUnderwriter === uw.id
                                                ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className={`w-4 h-4 ${selectedUnderwriter === uw.id ? 'text-slate-400' : 'text-slate-400'}`} />
                                                <span className="font-bold text-sm">{uw.email.split('@')[0]}</span>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded ${selectedUnderwriter === uw.id ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                                {uw.active_cases} Cases
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };


    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!caseData) return <div className="min-h-screen flex items-center justify-center">Case not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Intake Info Modal */}
            {showIntakeInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowIntakeInfo(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slideDown"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shadow-sm border border-blue-100">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 leading-tight">CST Intake Information</h2>
                                    <p className="text-sm text-slate-500 font-medium">Original case context from initial intake</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowIntakeInfo(false)}
                                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto bg-slate-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Defendant Info */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Defendant
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Full Name</div>
                                            <div className="font-bold text-slate-900 text-lg">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                                        </div>
                                        <div className="flex gap-6">
                                            {caseData.defendant_dob && (
                                                <div>
                                                    <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">DOB</div>
                                                    <div className="text-sm text-slate-900 font-bold">{new Date(caseData.defendant_dob).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                            {caseData.defendant_gender && (
                                                <div>
                                                    <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Gender</div>
                                                    <div className="text-sm text-slate-900 font-bold">{caseData.defendant_gender}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" />
                                        Location
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Jail Facility</div>
                                            <div className="font-bold text-slate-900">{caseData.jail_facility}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Jurisdiction</div>
                                            <div className="text-sm text-slate-900 font-bold">{caseData.county}, {caseData.state_jurisdiction}</div>
                                        </div>
                                        {caseData.booking_number && (
                                            <div>
                                                <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Booking #</div>
                                                <div className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block mt-0.5 font-bold border border-slate-200">{caseData.booking_number}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bond Details */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Bond Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Bond Amount</div>
                                            <div className="font-bold text-slate-900 text-2xl tracking-tight">${caseData.bond_amount.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Type & Severity</div>
                                            <div className="text-sm text-slate-900 font-bold">{caseData.bond_type} • {caseData.charge_severity}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Caller Info */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Caller
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Name</div>
                                            <div className="font-bold text-slate-900">{caseData.caller_name}</div>
                                            <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">{caseData.caller_relationship}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Contact</div>
                                            <div className="text-sm text-slate-900 font-bold">{caseData.caller_phone}</div>
                                            {caseData.caller_email && <div className="text-xs text-slate-500 font-medium mt-0.5">{caseData.caller_email}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Intent Signal */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5" />
                                        Intent Level
                                    </h3>
                                    <div className="space-y-4">
                                        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold border-2 ${caseData.intent_signal === 'GET_OUT_TODAY' ? 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100' :
                                            caseData.intent_signal === 'CHECKING_COST' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100' :
                                                'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100'
                                            }`}>
                                            <span className="text-lg">
                                                {caseData.intent_signal === 'GET_OUT_TODAY' ? '⚡' :
                                                    caseData.intent_signal === 'CHECKING_COST' ? '💰' : 'ℹ️'}
                                            </span>
                                            {caseData.intent_signal?.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium italic">
                                            {caseData.intent_signal === 'GET_OUT_TODAY' ? 'High urgency - needs bond posted today.' :
                                                caseData.intent_signal === 'CHECKING_COST' ? 'Price sensitive - evaluating options.' : 'Gathering information for decision.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Fast Flags */}
                                {caseData.fast_flags && caseData.fast_flags.length > 0 && (
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" />
                                            CST Observations
                                        </h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {caseData.fast_flags.map((flag, idx) => (
                                                <span key={idx} className="bg-white text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white text-center">
                            <button
                                onClick={() => setShowIntakeInfo(false)}
                                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="bg-white border-b px-8 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/advisor')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div
                        onClick={() => setShowIntakeInfo(true)}
                        className="cursor-pointer group px-3 py-1 -ml-3 rounded-xl transition-all hover:bg-blue-50/50"
                    >
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                {caseData.defendant_first_name} {caseData.defendant_last_name}
                            </h1>
                            <div className="bg-blue-50 text-blue-600 p-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                            <span className="text-blue-600 font-bold">${caseData?.bond_amount ? caseData.bond_amount.toLocaleString() : '0'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{caseData.jail_facility}</span>
                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 uppercase tracking-tighter transition-all">Click for details</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isReadOnly && !isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Edit Case
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isReadOnly && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <History className="w-4 h-4" />
                                Save Draft
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 px-4">


                {/* Stepper only if editing or active */}
                {(!isReadOnly || isEditing) && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center relative">
                            {/* Progress Bar Background */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />

                            {activeSteps.map((step, index) => {
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2 transition-all duration-300">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold ${isCompleted
                                                ? 'bg-slate-900 border-slate-900 text-white'
                                                : isCurrent
                                                    ? 'bg-white border-slate-900 text-slate-900'
                                                    : 'bg-white border-slate-300 text-slate-300'
                                                }`}
                                        >
                                            {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                                        </div>
                                        <span className={`text-sm font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Content */}
                {(!isReadOnly || isEditing) ? (
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            {renderStepContent()}
                        </div>



                        {/* Footer Actions */}
                        <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-200">
                            {(() => {
                                const handleNext = () => {
                                    const stepId = activeSteps[currentStep].id;

                                    if (stepId === 'financials') {
                                        const financialStepsCount = 2; // Premium, Collateral
                                        if (financialSubStep < financialStepsCount - 1) {
                                            setFinancialSubStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            return;
                                        }
                                    }

                                    if (stepId === 'parties') {
                                        const partiesStepsCount = 3; // Indemnitor Info, Indemnitor Contact, Defendant
                                        if (partiesSubStep < partiesStepsCount - 1) {
                                            setPartiesSubStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            return;
                                        }
                                    }

                                    if (stepId === 'agreement') {
                                        // Calculate total sub-steps dynamically based on contact method
                                        const subStepsCount = contactMethod === 'REMOTE' ? 1 : (premiumType === 'DEFERRED' ? 7 : 6);

                                        if (agreementSubStep < subStepsCount - 1) {
                                            setAgreementSubStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            return;
                                        }
                                    }

                                    if (stepId === 'docs') {
                                        const docStepsCount = hasCollateral !== 'NO' ? 5 : 4;
                                        if (docSubStep < docStepsCount - 1) {
                                            setDocSubStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            return;
                                        }
                                    }

                                    setCurrentStep(prev => Math.min(activeSteps.length - 1, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                };

                                const handleBack = () => {
                                    const stepId = activeSteps[currentStep].id;

                                    if (stepId === 'financials' && financialSubStep > 0) {
                                        setFinancialSubStep(prev => prev - 1);
                                        return;
                                    }

                                    if (stepId === 'parties' && partiesSubStep > 0) {
                                        setPartiesSubStep(prev => prev - 1);
                                        return;
                                    }

                                    if (stepId === 'agreement' && agreementSubStep > 0) {
                                        setAgreementSubStep(prev => prev - 1);
                                        return;
                                    }

                                    if (stepId === 'docs' && docSubStep > 0) {
                                        setDocSubStep(prev => prev - 1);
                                        return;
                                    }

                                    // If moving back TO agreement from Docs, set to last sub-step?
                                    // Current behavior: State persists, so it will be at last step. Good.

                                    setCurrentStep(prev => Math.max(0, prev - 1));
                                };

                                return (
                                    <>
                                        <button
                                            onClick={handleBack}
                                            disabled={currentStep === 0}
                                            className={`flex items-center text-slate-500 hover:text-slate-800 font-bold px-4 py-2 rounded-lg transition-colors
                                                ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                                            `}
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </button>

                                        {currentStep === activeSteps.length - 1 ? (
                                            engagementType === 'QUOTE_ONLY' ? (
                                                <button
                                                    onClick={async () => {
                                                        await handleSaveDraft();
                                                        navigate('/advisor');
                                                    }}
                                                    disabled={saving}
                                                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
                                                >
                                                    {saving ? 'Saving...' : 'Save Quote & Exit'}
                                                    <History className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSubmitToUnderwriter}
                                                    disabled={saving}
                                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
                                                >
                                                    {saving ? 'Submitting...' : 'Submit to Underwriter'}
                                                    <Check className="w-5 h-5" />
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={handleNext}
                                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
                                            >
                                                {(activeSteps[currentStep].id === 'financials' && financialSubStep < 1) ||
                                                    (activeSteps[currentStep].id === 'parties' && partiesSubStep < 2) || // 3 steps total
                                                    (activeSteps[currentStep].id === 'agreement' && agreementSubStep < (contactMethod === 'REMOTE' ? 0 : (premiumType === 'DEFERRED' ? 6 : 5))) ||
                                                    (activeSteps[currentStep].id === 'docs' && docSubStep < (hasCollateral !== 'NO' ? 4 : 3))
                                                    ? 'Next'
                                                    : 'Next Step'}
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </>
                ) : (
                    renderSummary()
                )}
            </div>
        </div>
    );
}
