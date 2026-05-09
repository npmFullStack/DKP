// src/components/WarningModal.tsx
import { X, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface WarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    submitIcon?: ReactNode;
    submitText?: string;
}

const WarningModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    isLoading = false,
    submitIcon,
    submitText = "Confirm"
}: WarningModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-secondary rounded-xl shadow-2xl max-w-md w-full border border-white/10 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-300">{message}</p>
                </div>
                
                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{submitText}...</span>
                            </>
                        ) : (
                            <>
                                {submitIcon}
                                <span>{submitText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarningModal;