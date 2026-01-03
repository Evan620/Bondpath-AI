import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiClient as api } from '../../api/client';
import { Check, ChevronRight, DollarSign, FileText, History, PenTool, Scale, User, X, ChevronDown, ArrowLeft, Upload, AlertTriangle, ScanEye, Clock, LogOut, ShieldCheck, Calendar, Stamp, Fingerprint, Phone, Gavel } from 'lucide-react';
import SignaturePad from './SignaturePad';
import FileUpload from './FileUpload';
import { useAuth } from '../../store/AuthContext';

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
    created_at: string;
    power_number?: string;
    court_case_number?: string;
    paid_in_full?: string;
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
    const { logout } = useAuth();
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
    // const [isEditing, setIsEditing] = useState(false);
    const isEditing = false; // Fixed for now

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
            // Step 1: Trigger AI risk re-assessment with complete case data
            console.log('Running AI risk assessment with complete case data...');
            try {
                const riskResponse = await api.post(`/cases/${id}/assess-risk`);
                console.log('Risk assessment completed:', riskResponse.data);
            } catch (riskError) {
                console.error('Risk assessment failed (non-blocking):', riskError);
                // Don't block submission if AI fails, but log it
            }

            // Step 2: Submit case to underwriter
            await saveData('UNDERWRITING_REVIEW', selectedUnderwriter);

            alert('Case submitted to underwriter successfully! AI risk assessment has been updated.');
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

    const renderSummary = () => {
        if (!caseData) return null;

        const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            });
        };

        const premiumValue = caseData.bond_amount ? (caseData.bond_amount * 0.1).toLocaleString() : '0';

        return (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Hero Card - Matching Underwriter Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-md gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{caseData.defendant_first_name} {caseData.defendant_last_name}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${caseData.state === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    caseData.state === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {caseData.state === 'APPROVED' ? 'Approved' : caseData.state === 'UNDERWRITING_REVIEW' ? 'In Review' : 'Advisor Intake'}
                                </span>
                            </div>
                            <div className="flex items-center gap-6 mt-3 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>Intake: {formatDate(caseData.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600">
                                    <Stamp className="w-4 h-4" />
                                    <span className="font-bold">Case #{caseData.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">${caseData.bond_amount?.toLocaleString() || '0'}.00</div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Total Bond Amount</p>
                    </div>
                </div>

                {/* Info Grid - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CST Intake Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:border-blue-100 transition-all">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-blue-500" />
                            CST Intake Information
                        </h3>
                        <div className="space-y-4 flex-grow">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Contact</div>
                                <div className="font-bold text-slate-900 text-sm">{caseData.indemnitor_first_name} {caseData.indemnitor_last_name}</div>
                            </div>
                            <div className="flex justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Relationship</div>
                                    <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black w-fit">{caseData.indemnitor_relationship || 'N/A'}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</div>
                                    <div className="font-bold text-slate-900 text-xs">{caseData.indemnitor_phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 mt-6 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            Original Caller Data Verified
                        </div>
                    </div>

                    {/* Defendant Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-blue-100 transition-all">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Fingerprint className="w-3.5 h-3.5 text-blue-500" />
                            Defendant Profile
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Charges & Severity</div>
                                <div className="font-bold text-slate-900 text-sm line-clamp-2">{caseData.charges || 'No specific charges listed'}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detention Facility</div>
                                    <div className="font-bold text-slate-900 text-xs">{caseData.jail_facility || 'Local Intake'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</div>
                                    <div className="font-bold text-slate-900 text-xs">{caseData.defendant_gender || 'Not Specified'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advisor Processing Block */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-blue-100 transition-all">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            Advisor Processing
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Engagement</div>
                                <div className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black w-fit">{engagementType === 'PROCEED_NOW' ? 'FULL APP' : 'QUOTE ONLY'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Premium Total</div>
                                <div className="font-black text-blue-600 text-sm">${premiumValue}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Plan</div>
                                <div className="font-bold text-slate-900 text-xs">{premiumType === 'FULL_PREMIUM' ? 'Paid in Full' : 'Structured'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Method</div>
                                <div className="font-bold text-slate-900 text-xs">{paymentMethod}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documentation & Signatures Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                Execution Status
                            </h3>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">ALL SECTIONS COMPLETE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { label: 'Agreement Terms', val: termsSignature },
                                { label: 'Fee Disclosure', val: feeDisclosureSignature },
                                { label: 'Contact Consent', val: contactAgreementSignature },
                                { label: 'Official Signature', val: indemnitorSignature }
                            ].map((sig, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-xs font-bold text-slate-500">{sig.label}</span>
                                    {sig.val ? (
                                        <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px]">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                            SIGNED
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-300">PENDING</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Gavel className="w-3.5 h-3.5 text-blue-500" />
                            Advisor Field Context
                        </h3>
                        <div className="bg-slate-50 rounded-2xl p-6 flex-grow border border-slate-100 italic font-medium text-slate-600 text-sm leading-relaxed">
                            {advisorNotes ? `"${advisorNotes}"` : "No additional context notes provided by the advisor for this case."}
                        </div>
                        {advisorNotes && (
                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <History className="w-3 h-3" />
                                Timestamped for Underwriter Review
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Process Initiation</h3>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Is the client ready to proceed?</h2>
                            <p className="text-slate-500 font-medium mt-1">Determine if this is just a quote or an active application.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setEngagementType('PROCEED_NOW')}
                                className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${engagementType === 'PROCEED_NOW'
                                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 transform -translate-y-0.5'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${engagementType === 'PROCEED_NOW' ? 'bg-white/20' : 'bg-blue-50'}`}>
                                    <FileText className={`w-5 h-5 ${engagementType === 'PROCEED_NOW' ? 'text-white' : 'text-blue-600'}`} />
                                </div>
                                <h4 className={`text-lg font-black mb-1 ${engagementType === 'PROCEED_NOW' ? 'text-white' : 'text-slate-900'}`}>Full Application</h4>
                                <p className={`text-xs font-medium leading-relaxed ${engagementType === 'PROCEED_NOW' ? 'text-blue-50' : 'text-slate-500'}`}>
                                    Begin the full underwriting process immediately. Recommended for active cases.
                                </p>
                                {engagementType === 'PROCEED_NOW' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={() => setEngagementType('QUOTE_ONLY')}
                                className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${engagementType === 'QUOTE_ONLY'
                                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 transform -translate-y-0.5'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${engagementType === 'QUOTE_ONLY' ? 'bg-white/20' : 'bg-slate-50'}`}>
                                    <DollarSign className={`w-5 h-5 ${engagementType === 'QUOTE_ONLY' ? 'text-white' : 'text-slate-900'}`} />
                                </div>
                                <h4 className={`text-lg font-black mb-1 ${engagementType === 'QUOTE_ONLY' ? 'text-white' : 'text-slate-900'}`}>Quote Only</h4>
                                <p className={`text-xs font-medium leading-relaxed ${engagementType === 'QUOTE_ONLY' ? 'text-blue-50' : 'text-slate-500'}`}>
                                    Provide pricing information only without starting a full review.
                                </p>
                                {engagementType === 'QUOTE_ONLY' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 'financials':
                const financialSteps = [
                    { id: 'premium', title: 'Premium' },
                    { id: 'collateral', title: 'Collateral' }
                ];
                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Premium Sub-step Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Financial Analysis</h3>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {financialSubStep === 0 ? 'Premium & Payment' : 'Collateral Assets'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {financialSteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx <= financialSubStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 ml-2">
                                    {financialSubStep + 1} / {financialSteps.length}
                                </span>
                            </div>
                        </div>

                        {financialSubStep === 0 && (
                            <div className="space-y-8 animate-slideUp">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Scale className="w-3 h-3 text-blue-600" />
                                            Premium Arrangement
                                        </label>
                                        <select
                                            value={premiumType}
                                            onChange={(e) => setPremiumType(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 appearance-none shadow-sm shadow-slate-100"
                                        >
                                            <option value="FULL_PREMIUM">Full Premium Paid</option>
                                            <option value="PAYMENT_PLAN">Structured Payment Plan</option>
                                            <option value="DEFERRED">Deferred (Post-Release)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <DollarSign className="w-3 h-3 text-blue-600" />
                                            Settlement Method
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 appearance-none shadow-sm shadow-slate-100"
                                        >
                                            <option value="CASH">Liquid Cash</option>
                                            <option value="CARD">Credit / Debit Card</option>
                                            <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                                            <option value="MONEY_ORDER">Certified Money Order</option>
                                            <option value="COLLATERAL">Collateral Only</option>
                                        </select>
                                    </div>
                                </div>

                                {premiumType === 'PAYMENT_PLAN' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-blue-50/30 rounded-[2rem] border-2 border-blue-100/30 shadow-inner">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Down Payment Required</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 font-black text-lg">$</span>
                                                <input
                                                    type="number"
                                                    value={downPayment}
                                                    onChange={(e) => setDownPayment(e.target.value)}
                                                    className="w-full pl-10 pr-6 py-5 bg-white border-2 border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-2xl text-blue-900 transition-all placeholder:text-blue-200"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Monthly Installment</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 font-black text-lg">$</span>
                                                <input
                                                    type="number"
                                                    value={monthlyPayment}
                                                    onChange={(e) => setMonthlyPayment(e.target.value)}
                                                    className="w-full pl-10 pr-6 py-5 bg-white border-2 border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-2xl text-blue-900 transition-all placeholder:text-blue-200"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {financialSubStep === 1 && (
                            <div className="animate-slideUp space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Security Requirement</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['YES', 'NO', 'UNSURE'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setHasCollateral(opt)}
                                                className={`px-6 py-4 rounded-2xl border-2 font-black text-sm transition-all ${hasCollateral === opt
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Collateral Description</label>
                                    <textarea
                                        value={collateralDesc}
                                        onChange={(e) => setCollateralDesc(e.target.value)}
                                        rows={4}
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Identify specific assets, real estate, or other property being held..."
                                    />
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
                    <div className="space-y-8 animate-fadeIn">
                        {/* Premium Sub-step Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Entity Verification</h3>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {partiesSubStep === 0 ? 'Indemnitor Identity' : partiesSubStep === 1 ? 'Contact Information' : 'Case Specifics'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {partySteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx <= partiesSubStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 ml-2">
                                    {partiesSubStep + 1} / {partySteps.length}
                                </span>
                            </div>
                        </div>

                        {partiesSubStep === 0 && (
                            <div className="animate-slideUp space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal First Name</label>
                                        <input
                                            value={indemnitorFirstName}
                                            onChange={(e) => setIndemnitorFirstName(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="Enter first name..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Last Name</label>
                                        <input
                                            value={indemnitorLastName}
                                            onChange={(e) => setIndemnitorLastName(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="Enter last name..."
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defendant Relationship</label>
                                        <select
                                            value={indemnitorRelationship}
                                            onChange={(e) => setIndemnitorRelationship(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 appearance-none shadow-sm"
                                        >
                                            <option value="">Define Relationship...</option>
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
                            <div className="animate-slideUp space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Phone Line</label>
                                        <input
                                            value={indemnitorPhone}
                                            onChange={(e) => setIndemnitorPhone(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="(000) 000-0000"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                        <input
                                            value={indemnitorEmail}
                                            onChange={(e) => setIndemnitorEmail(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="client@example.com"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</label>
                                        <input
                                            value={indemnitorAddress}
                                            onChange={(e) => setIndemnitorAddress(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="Full permanent residence address..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {partiesSubStep === 2 && (
                            <div className="animate-slideUp space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defendant SSN (Last 4)</label>
                                        <input
                                            value={ssnLast4}
                                            onChange={(e) => setSsnLast4(e.target.value)}
                                            maxLength={4}
                                            className="w-40 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-black text-2xl text-center tracking-[0.2em] text-slate-800 shadow-sm"
                                            placeholder="0000"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Charges</label>
                                        <textarea
                                            value={charges}
                                            onChange={(e) => setCharges(e.target.value)}
                                            rows={4}
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                            placeholder="Specify all current charges as listed on booking sheet..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'agreement':
                const agreementSteps = [
                    { id: 'method', title: 'Agreement Method' },
                    ...(contactMethod === 'REMOTE' ? [] : [
                        { id: 'terms', title: 'Terms & Conditions' },
                        { id: 'fees', title: 'Fee Disclosure' },
                        { id: 'contact', title: 'Defendant Contact Agreement' },
                        ...(premiumType === 'DEFERRED' ? [{ id: 'deferred', title: 'Deferred Payment Authorization' }] : []),
                        { id: 'final', title: 'Indemnitor Signature' },
                        { id: 'cosigner', title: 'Co-Signer (Optional)' }
                    ])
                ];

                const currentSubStep = agreementSteps[agreementSubStep];
                if (!currentSubStep) return null;

                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Premium Sub-step Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authorization</h3>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {currentSubStep.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {agreementSteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx <= agreementSubStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 ml-2">
                                    {agreementSubStep + 1} / {agreementSteps.length}
                                </span>
                            </div>
                        </div>

                        {currentSubStep.id === 'method' && (
                            <div className="space-y-8 animate-slideUp">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setContactMethod('IN_PERSON')}
                                        className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${contactMethod === 'IN_PERSON'
                                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 transform -translate-y-0.5'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${contactMethod === 'IN_PERSON' ? 'bg-white/20' : 'bg-blue-50'}`}>
                                            <PenTool className={`w-5 h-5 ${contactMethod === 'IN_PERSON' ? 'text-white' : 'text-blue-600'}`} />
                                        </div>
                                        <h4 className={`text-lg font-black mb-1 ${contactMethod === 'IN_PERSON' ? 'text-white' : 'text-slate-900'}`}>In Person</h4>
                                        <p className={`text-xs font-medium leading-relaxed ${contactMethod === 'IN_PERSON' ? 'text-blue-50' : 'text-slate-500'}`}>
                                            Complete and sign all documents on this device with the client present.
                                        </p>
                                        {contactMethod === 'IN_PERSON' && (
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setContactMethod('REMOTE')}
                                        className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${contactMethod === 'REMOTE'
                                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 transform -translate-y-0.5'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${contactMethod === 'REMOTE' ? 'bg-white/20' : 'bg-slate-50'}`}>
                                            <Upload className={`w-5 h-5 ${contactMethod === 'REMOTE' ? 'text-white' : 'text-slate-900'}`} />
                                        </div>
                                        <h4 className={`text-lg font-black mb-1 ${contactMethod === 'REMOTE' ? 'text-white' : 'text-slate-900'}`}>Remote Signature</h4>
                                        <p className={`text-xs font-medium leading-relaxed ${contactMethod === 'REMOTE' ? 'text-blue-50' : 'text-slate-500'}`}>
                                            Securely email a signature link to the client for remote execution.
                                        </p>
                                        {contactMethod === 'REMOTE' && (
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {contactMethod === 'REMOTE' && (
                                    <div className="animate-slideUp p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Client Email Address</label>
                                            <input
                                                value={clientEmailForRemote}
                                                onChange={(e) => setClientEmailForRemote(e.target.value)}
                                                className="w-full px-6 py-5 bg-white border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                                placeholder="client@example.com"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                    <ScanEye className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-sm">Push Signature Link</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verification Required</div>
                                                </div>
                                            </div>

                                            {remoteAckSent === 'YES' ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border-2 border-green-100 text-xs">
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    REQUEST SENT
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
                                                        } catch (error) {
                                                            console.error('Remote signature failed:', error);
                                                            alert('Failed to send request.');
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                                >
                                                    SEND NOW
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(currentSubStep.id === 'terms' || currentSubStep.id === 'fees' || currentSubStep.id === 'contact' || currentSubStep.id === 'deferred' || currentSubStep.id === 'cosigner') && (
                            <div className="animate-slideUp space-y-8">
                                <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-slate-100">
                                    {currentSubStep.id === 'terms' && (
                                        <div className="space-y-6">
                                            <div className="prose prose-slate max-w-none text-sm font-medium text-slate-600 leading-relaxed max-h-48 overflow-y-auto p-6 bg-white rounded-2xl border border-slate-150 shadow-inner">
                                                <p className="font-bold text-slate-900 mb-2 underline decoration-blue-500 decoration-2">Standard Bail Bond Conditions</p>
                                                <p>1. The defendant will appear in all courts as required.</p>
                                                <p>2. The defendant will not leave the jurisdiction without express permission.</p>
                                                <p>3. The indemnitor assumes full financial responsibility for the face value of the bond.</p>
                                                <p className="mt-4">By signing below, you acknowledge and agree to these terms in their entirety.</p>
                                            </div>
                                            <SignaturePad
                                                label="Indemnitor Signature"
                                                value={termsSignature}
                                                onChange={setTermsSignature}
                                            />
                                        </div>
                                    )}

                                    {currentSubStep.id === 'fees' && (
                                        <div className="space-y-6 text-center py-4">
                                            <div className="inline-block p-6 bg-white rounded-3xl border-2 border-blue-50 shadow-sm mb-6">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Premium Due</div>
                                                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                                    ${caseData?.bond_amount ? (caseData.bond_amount * 0.1).toLocaleString() : '0.00'}
                                                </div>
                                            </div>
                                            <SignaturePad
                                                label="Acknowledgment of Fees"
                                                value={feeDisclosureSignature}
                                                onChange={setFeeDisclosureSignature}
                                            />
                                        </div>
                                    )}

                                    {currentSubStep.id === 'contact' && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-blue-50/50 rounded-2xl border-2 border-blue-100/30 text-sm font-bold text-blue-900 mb-6">
                                                The defendant agrees to daily check-ins and to notify the agency of any changes in residential status immediately.
                                            </div>
                                            <SignaturePad
                                                label="Monitoring Agreement"
                                                value={contactAgreementSignature}
                                                onChange={setContactAgreementSignature}
                                            />
                                        </div>
                                    )}

                                    {currentSubStep.id === 'deferred' && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 text-sm font-bold text-amber-900 mb-6">
                                                AUTHORIZATION: I authorize Bondpath AI to process future payments according to the agreed-upon structured settlement plan.
                                            </div>
                                            <SignaturePad
                                                label="Payment Authorization"
                                                value={deferredPaymentAuthSignature}
                                                onChange={setDeferredPaymentAuthSignature}
                                            />
                                        </div>
                                    )}

                                    {currentSubStep.id === 'cosigner' && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Co-Signer Full Name</label>
                                                    <input
                                                        value={coSignerName}
                                                        onChange={(e) => setCoSignerName(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-800"
                                                        placeholder="Enter legal name..."
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Co-Signer Contact</label>
                                                    <input
                                                        value={coSignerPhone}
                                                        onChange={(e) => setCoSignerPhone(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-800"
                                                        placeholder="(000) 000-0000"
                                                    />
                                                </div>
                                            </div>
                                            <SignaturePad
                                                label="Co-Signer Signature"
                                                value={coSignerSignature}
                                                onChange={setCoSignerSignature}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentSubStep.id === 'final' && (
                            <div className="animate-slideUp space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printed Name</label>
                                        <input
                                            value={indemnitorPrintedName}
                                            onChange={(e) => setIndemnitorPrintedName(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl text-slate-900 shadow-sm"
                                            placeholder="Indemnitor Name"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Date</label>
                                        <input
                                            type="date"
                                            value={indemnitorSignatureDate}
                                            onChange={(e) => setIndemnitorSignatureDate(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="p-8 rounded-[2rem] border-2 border-slate-100 bg-slate-50/30">
                                    <SignaturePad
                                        label="Official Indemnitor Signature"
                                        value={indemnitorSignature}
                                        onChange={setIndemnitorSignature}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'docs':
                const docSteps = [
                    { id: 'booking', title: 'Booking Sheet' },
                    { id: 'defendant_id', title: 'Defendant ID' },
                    { id: 'indemnitor_id', title: 'Indemnitor ID' },
                    { id: 'gov_id', title: 'Social Security / Gov ID' },
                    ...(hasCollateral !== 'NO' ? [{ id: 'collateral', title: 'Collateral Docs' }] : [])
                ];

                const currentDocStep = docSteps[docSubStep];
                if (!currentDocStep) return null;

                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Premium Sub-step Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Evidence Collection</h3>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {currentDocStep.title} Verification
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {docSteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx <= docSubStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 ml-2">
                                    {docSubStep + 1} / {docSteps.length}
                                </span>
                            </div>
                        </div>

                        <div className="animate-slideUp">
                            <FileUpload
                                label={currentDocStep.title}
                                description={`Securely upload the supporting file for ${currentDocStep.title}.`}
                                value={
                                    currentDocStep.id === 'booking' ? bookingSheetUrl :
                                        currentDocStep.id === 'defendant_id' ? defendantIdUrl :
                                            currentDocStep.id === 'indemnitor_id' ? indemnitorIdUrl :
                                                currentDocStep.id === 'gov_id' ? govIdUrl :
                                                    collateralDocUrl
                                }
                                onFileSelect={(f) => handleFileUpload(f, currentDocStep.id === 'gov_id' ? 'gov_id' : currentDocStep.id === 'collateral' ? 'collateral_doc' : currentDocStep.id as any)}
                                onClear={() => {
                                    if (currentDocStep.id === 'booking') setBookingSheetUrl('');
                                    else if (currentDocStep.id === 'defendant_id') setDefendantIdUrl('');
                                    else if (currentDocStep.id === 'indemnitor_id') setIndemnitorIdUrl('');
                                    else if (currentDocStep.id === 'gov_id') setGovIdUrl('');
                                    else setCollateralDocUrl('');
                                }}
                            />

                            {/* Verification Logic Mapping */}
                            {(currentDocStep.id === 'booking' && bookingSheetUrl) && renderDocVerifier('booking_sheet', bookingSheetUrl)}
                            {(currentDocStep.id === 'defendant_id' && defendantIdUrl) && renderDocVerifier('defendant_id', defendantIdUrl)}
                            {(currentDocStep.id === 'indemnitor_id' && indemnitorIdUrl) && renderDocVerifier('indemnitor_id', indemnitorIdUrl)}
                            {(currentDocStep.id === 'gov_id' && govIdUrl) && renderDocVerifier('gov_id', govIdUrl)}
                            {(currentDocStep.id === 'collateral' && collateralDocUrl) && renderDocVerifier('collateral_doc', collateralDocUrl)}
                        </div>
                    </div>
                );
            case 'quote_summary':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Summary Generated</h3>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bond Quote Overview</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex flex-col items-center text-center">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-4">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bond</div>
                                <div className="text-2xl font-black text-slate-900">${caseData?.bond_amount?.toLocaleString() || '0.00'}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex flex-col items-center text-center">
                                <div className="p-3 bg-slate-50 text-slate-900 rounded-xl mb-4">
                                    <Scale className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Premium Plan</div>
                                <div className="text-lg font-black text-slate-800">{premiumType === 'FULL_PREMIUM' ? 'Full Payment' : 'Financed'}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex flex-col items-center text-center">
                                <div className="p-3 bg-slate-50 text-slate-900 rounded-xl mb-4">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</div>
                                <div className="text-lg font-black text-slate-800">{paymentMethod}</div>
                            </div>
                        </div>

                        <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[2rem] flex items-center gap-6">
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <History className="w-8 h-8 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-amber-900 mb-1">Ready for Application?</h4>
                                <p className="text-sm font-medium text-amber-700">This quote is saved in your dashboard. You can convert it to a full application at any time.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Final Review</h3>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assignment & Submission</h2>
                        </div>

                        {/* Submission Quality Audit (Premium Refined) */}
                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                        <ScanEye className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">Submission Quality Audit</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Automated Intelligence Scan</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckReadiness}
                                    disabled={aiChecking}
                                    className="px-6 py-2 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {aiChecking ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            SCANNING...
                                        </>
                                    ) : 'RUN AUDIT'}
                                </button>
                            </div>

                            <div className="p-8">
                                {!readinessResult && !aiChecking && (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-300 gap-4 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <AlertTriangle className="w-12 h-12" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Awaiting quality verification</p>
                                    </div>
                                )}

                                {readinessResult && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-8">
                                            <div className="relative">
                                                <svg className="w-24 h-24 transform -rotate-90">
                                                    <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                                                    <circle
                                                        className={readinessResult.confidence_score > 70 ? 'text-green-500' : 'text-amber-500'}
                                                        strokeWidth="8"
                                                        strokeDasharray={251.2}
                                                        strokeDashoffset={251.2 - (251.2 * readinessResult.confidence_score) / 100}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="40"
                                                        cx="48"
                                                        cy="48"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-black text-slate-900">{readinessResult.confidence_score}</span>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Score</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-xl font-black mb-1 ${readinessResult.ready_for_submission ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {readinessResult.ready_for_submission ? 'Clear for Submission' : 'Incomplete Requirements'}
                                                </h4>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                                    {readinessResult.quality_notes || "Your application has been scanned for potential risks and missing data."}
                                                </p>
                                            </div>
                                        </div>

                                        {(readinessResult.blockers.length > 0 || readinessResult.warnings.length > 0) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {readinessResult.blockers.map((b, i) => (
                                                    <div key={`b-${i}`} className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        {b}
                                                    </div>
                                                ))}
                                                {readinessResult.warnings.map((w, i) => (
                                                    <div key={`w-${i}`} className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-xs font-bold">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                        {w}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advisor Field Notes</label>
                                <textarea
                                    value={advisorNotes}
                                    onChange={(e) => setAdvisorNotes(e.target.value)}
                                    rows={6}
                                    className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                                    placeholder="Add context for the underwriter..."
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Underwriter</label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {underwriters.map((uw) => (
                                        <button
                                            key={uw.id}
                                            onClick={() => setSelectedUnderwriter(uw.id)}
                                            className={`px-4 py-3 rounded-xl border-2 flex justify-between items-center transition-all ${selectedUnderwriter === uw.id
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${selectedUnderwriter === uw.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="font-black text-xs">{uw.email.split('@')[0]}</span>
                                            </div>
                                            <div className={`text-[9px] font-black px-2 py-0.5 rounded-full ${selectedUnderwriter === uw.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {uw.active_cases} ACTIVE
                                            </div>
                                        </button>
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
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Premium Sticky Navbar (Light Theme Refined) */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 rounded-lg shadow-md ring-1 ring-blue-400/30">
                                <Scale className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 font-black tracking-tighter text-lg leading-none">BONDPATH <span className="text-blue-600">AI</span></span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-1">Advisor Portal</span>
                            </div>
                        </div>
                        <div className="h-6 w-px bg-slate-100" />
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/advisor')}
                                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div
                                onClick={() => setShowIntakeInfo(true)}
                                className="cursor-pointer group px-2 py-1 rounded-lg transition-all hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {caseData ? `${caseData.defendant_first_name} ${caseData.defendant_last_name}` : 'Loading...'}
                                    </h1>
                                    <div className="bg-slate-100 text-slate-400 p-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 font-medium">
                                    <span className="text-blue-600 font-bold">${caseData?.bond_amount ? caseData.bond_amount.toLocaleString() : '0'}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{caseData?.jail_facility || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Court Case</span>
                            <span className="text-[10px] text-slate-600 font-mono mt-1">{caseData?.id.split('-')[0].toUpperCase() || 'N/A'}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-100" />
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                            <History className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto py-12 px-6">
                {/* Premium Step Indicator */}
                {(!isReadOnly || isEditing) && (
                    <div className="mb-12">
                        <div className="flex justify-between items-center max-w-3xl mx-auto relative px-4">
                            {/* Connector Line */}
                            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-10" />

                            {activeSteps.map((step, index) => {
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-3 bg-slate-50 px-4 transition-all duration-500">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 font-black text-xs shadow-sm ring-4 ${isCompleted
                                                ? 'bg-blue-500 border-blue-500 text-white ring-blue-500/10'
                                                : isCurrent
                                                    ? 'bg-blue-600 border-blue-600 text-white ring-blue-600/20 scale-110 shadow-blue-200'
                                                    : 'bg-white border-slate-200 text-slate-400 ring-transparent hover:border-slate-300'
                                                }`}
                                        >
                                            {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <span>{index + 1}</span>}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
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
                                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5"
                                                >
                                                    {saving ? 'Saving...' : 'Save Quote & Exit'}
                                                    <History className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSubmitToUnderwriter}
                                                    disabled={saving}
                                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 transform hover:-translate-y-0.5"
                                                >
                                                    {saving ? 'Submitting...' : 'Submit to Underwriter'}
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={handleNext}
                                                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 transform hover:-translate-y-0.5"
                                            >
                                                {(activeSteps[currentStep].id === 'financials' && financialSubStep < 1) ||
                                                    (activeSteps[currentStep].id === 'parties' && partiesSubStep < 2) || // 3 steps total
                                                    (activeSteps[currentStep].id === 'agreement' && agreementSubStep < (contactMethod === 'REMOTE' ? 0 : (premiumType === 'DEFERRED' ? 6 : 5))) ||
                                                    (activeSteps[currentStep].id === 'docs' && docSubStep < (hasCollateral !== 'NO' ? 4 : 3))
                                                    ? 'Next'
                                                    : 'Next Step'}
                                                <ChevronRight className="w-4 h-4" />
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
