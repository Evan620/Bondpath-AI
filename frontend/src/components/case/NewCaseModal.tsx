import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface NewCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const RELATIONSHIPS = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Friend',
    'Attorney', 'Bail Agent', 'Other'
];

const STEPS = [
    { title: 'Identity', fields: ['defendant_first_name', 'defendant_last_name'] },
    { title: 'Location', fields: ['jail_facility', 'county', 'state_jurisdiction'] },
    { title: 'Bond', fields: ['bond_amount', 'bond_type', 'charge_severity'] },
    { title: 'Caller', fields: ['caller_name', 'caller_relationship', 'caller_phone'] },
    { title: 'Triage', fields: ['intent_signal'] },
    { title: 'Context', fields: [] } // Optional flags
];

export const NewCaseModal = ({ isOpen, onClose, onSubmit }: NewCaseModalProps) => {
    const { register, handleSubmit, formState: { errors }, trigger, watch } = useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const intentSignal = watch('intent_signal');

    if (!isOpen) return null;

    const handleNext = async () => {
        const fieldsToValidate = STEPS[currentStep].fields;
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const onFormSubmit = async (data: any) => {
        console.log("onFormSubmit called with data:", data); // DEBUG

        // Transform fast_flags from object to array
        const fast_flags = [];
        if (data.flag_unsure) fast_flags.push('Caller seems unsure/nervous');
        if (data.flag_urgent) fast_flags.push('Caller seems urgent');
        if (data.flag_language) fast_flags.push('Language barrier');
        if (data.flag_experience) fast_flags.push('Prior bail experience mentioned');

        const caseData = {
            ...data,
            fast_flags,
            // Remove checkbox fields
            flag_unsure: undefined,
            flag_urgent: undefined,
            flag_language: undefined,
            flag_experience: undefined
        };

        console.log("Submitting caseData:", caseData); // DEBUG

        try {
            setIsSubmitting(true);
            await onSubmit(caseData);
            console.log("Submission successful"); // DEBUG
            // Parent will close modal on success
        } catch (error) {
            console.error("Submission error:", error);
            setIsSubmitting(false);
        }
    };

    // Debug errors
    const onError = (errors: any) => {
        console.error("Form validation errors:", errors);
    };

    const LoadingIndicator = () => (
        <div className="flex gap-1 mb-6 justify-center">
            {STEPS.map((_, idx) => (
                <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-600' :
                        idx < currentStep ? 'w-4 bg-blue-200' : 'w-2 bg-slate-100'
                        }`}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-inter">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">New Case Intake</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        // Only allow submission if we're on the last step
                        if (currentStep === STEPS.length - 1) {
                            handleSubmit(onFormSubmit)(e);
                        }
                    }}
                    className="flex-1 overflow-y-auto p-6 flex flex-col justify-between"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            // Only auto-advance on Enter if we're not on the last step
                            // This prevents accidental submission on Step 6
                            if (currentStep < STEPS.length - 1) {
                                handleNext();
                            }
                        }
                    }}
                >
                    <div>
                        <LoadingIndicator />

                        {/* Step 1: Defendant Identity */}
                        {currentStep === 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-semibold text-slate-800">Who is the defendant?</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">First Name</label>
                                        <input
                                            {...register('defendant_first_name', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="John"
                                            autoFocus
                                        />
                                        {errors.defendant_first_name && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                                        <input
                                            {...register('defendant_last_name', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Doe"
                                        />
                                        {errors.defendant_last_name && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                                        <input
                                            type="date"
                                            {...register('defendant_dob')}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Gender</label>
                                        <select
                                            {...register('defendant_gender')}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                        >
                                            <option value="">Optional...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-semibold text-slate-800">Where are they held?</h3>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Jail / Facility</label>
                                    <input
                                        {...register('jail_facility', { required: true })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="e.g. Harris County Jail"
                                        autoFocus
                                    />
                                    {errors.jail_facility && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">County</label>
                                        <input
                                            {...register('county', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="e.g. Harris"
                                        />
                                        {errors.county && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">State</label>
                                        <select
                                            {...register('state_jurisdiction', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                        >
                                            <option value="">Select...</option>
                                            {US_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        {errors.state_jurisdiction && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <label className="text-sm font-medium text-slate-500">Booking Number (Optional)</label>
                                    <input
                                        {...register('booking_number')}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="12345678"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Bond Info */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-semibold text-slate-800">Review the Bond</h3>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Total Bond Amount ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            {...register('bond_amount', { required: true, min: 0 })}
                                            className="w-full pl-8 pr-4 py-3 text-lg border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-bold text-slate-900"
                                            placeholder="25000"
                                            autoFocus
                                        />
                                    </div>
                                    {errors.bond_amount && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Bond Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['SURETY', 'CASH', 'PR', 'UNKNOWN'].map(type => (
                                            <label key={type} className={`
                                                flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer transition-all
                                                ${watch('bond_type') === type
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'}
                                            `}>
                                                <input type="radio" {...register('bond_type', { required: true })} value={type} className="hidden" />
                                                {type === 'SURETY' ? 'Surety' : type === 'CASH' ? 'Cash Only' : type === 'PR' ? 'PR Bond' : 'Unknown'}
                                            </label>
                                        ))}
                                    </div>
                                    {errors.bond_type && <p className="text-red-500 text-xs">Required</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Charge Severity</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['MISDEMEANOR', 'FELONY', 'UNKNOWN'].map(type => (
                                            <label key={type} className={`
                                                flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer transition-all text-sm
                                                ${watch('charge_severity') === type
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'}
                                            `}>
                                                <input type="radio" {...register('charge_severity', { required: true })} value={type} className="hidden" />
                                                {type.charAt(0) + type.slice(1).toLowerCase()}
                                            </label>
                                        ))}
                                    </div>
                                    {errors.charge_severity && <p className="text-red-500 text-xs">Required</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Caller Info */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-semibold text-slate-800">Who is calling?</h3>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Caller Name</label>
                                    <input
                                        {...register('caller_name', { required: true })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Jane Doe"
                                        autoFocus
                                    />
                                    {errors.caller_name && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Relationship</label>
                                        <select
                                            {...register('caller_relationship', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                        >
                                            <option value="">Select...</option>
                                            {RELATIONSHIPS.map(rel => (
                                                <option key={rel} value={rel}>{rel}</option>
                                            ))}
                                        </select>
                                        {errors.caller_relationship && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Primary Phone</label>
                                        <input
                                            type="tel"
                                            {...register('caller_phone', { required: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="(555) 123-4567"
                                        />
                                        {errors.caller_phone && <p className="text-red-500 text-xs mt-0.5">Required</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <label className="text-sm font-medium text-slate-500">Email (Optional)</label>
                                    <input
                                        {...register('caller_email')}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 5: Triage (Intent) */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Why are they calling?</h3>
                                    <p className="text-sm text-slate-500">This helps us prioritize the case correctly.</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { val: 'GET_OUT_TODAY', label: 'Trying to get them out today', icon: '🚨', desc: 'High priority - Ready to move' },
                                        { val: 'CHECKING_COST', label: 'Just checking cost', icon: '💰', desc: 'Shopping around - Standard priority' },
                                        { val: 'GATHERING_INFO', label: 'Gathering info', icon: '📝', desc: 'Early stage - Information only' },
                                        { val: 'UNSURE', label: 'Not sure yet', icon: '🤷', desc: 'Need guidance' }
                                    ].map((opt) => (
                                        <label
                                            key={opt.val}
                                            className={`
                                                flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-slate-50
                                                ${intentSignal === opt.val
                                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                    : 'border-slate-100'}
                                            `}
                                            onClick={(e) => {
                                                // Prevent any potential double-click or rapid-fire events
                                                e.stopPropagation();
                                            }}
                                        >
                                            <input type="radio" {...register('intent_signal', { required: true })} value={opt.val} className="hidden" />
                                            <span className="text-2xl mr-4">{opt.icon}</span>
                                            <div>
                                                <span className={`block font-semibold ${intentSignal === opt.val ? 'text-blue-900' : 'text-slate-900'}`}>{opt.label}</span>
                                                <span className="text-xs text-slate-500">{opt.desc}</span>
                                            </div>
                                            {intentSignal === opt.val && (
                                                <Check className="ml-auto h-5 w-5 text-blue-600" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                                {errors.intent_signal && <p className="text-center text-red-500 text-sm">Please select an option to continue</p>}
                            </div>
                        )}

                        {/* Step 6: Context (Flags) - RECREATED */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Any quick observations?</h3>
                                    <p className="text-sm text-slate-500">Optional flags to help the advisor. You can skip this step if none apply.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('flag_unsure')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                                        />
                                        <span className="text-slate-700 font-medium">Caller seems unsure / nervous</span>
                                    </label>

                                    <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('flag_urgent')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                                        />
                                        <span className="text-slate-700 font-medium">Caller seems urgent / panicked</span>
                                    </label>

                                    <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('flag_language')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                                        />
                                        <span className="text-slate-700 font-medium">Language barrier detected</span>
                                    </label>

                                    <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('flag_experience')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                                        />
                                        <span className="text-slate-700 font-medium">Mentioned prior bail experience</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 0 || isSubmitting}
                            className={`flex items-center text-slate-500 hover:text-slate-800 font-medium px-2 py-2 rounded-lg transition-colors
                                ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                            `}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </button>

                        {currentStep < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Next Step
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!isSubmitting) handleSubmit(onFormSubmit, onError)(e); // Added onError
                                }}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-200 hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? 'Creating...' : 'Submit Case'}
                                {!isSubmitting && <Check className="h-4 w-4 ml-2" />}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
