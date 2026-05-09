// src/components/StatCard.tsx
import { ComponentType, SVGProps } from "react";

interface StatCardProps {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    number: number | string;
}

const StatCard = ({ icon: Icon, title, number }: StatCardProps) => {
    return (
        <div className="bg-secondary/50 rounded-lg p-6 border border-white/10 hover:border-primary/50 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-2xl font-bold text-white">{number}</span>
            </div>
            <h3 className="text-gray-400 font-medium">{title}</h3>
        </div>
    );
};

export default StatCard;