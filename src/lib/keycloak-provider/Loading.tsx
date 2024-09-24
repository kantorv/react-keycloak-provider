import React from "react";
import './progress.css';
export const LoadingScreenSample = () => (
    <div style={{ height: "100vh", width: "100vw", display: 'flex', justifyContent: "center", alignItems: "center" }}>
        <svg width="100" height="100" viewBox="0 0 100 100" className="circular-progress">
            <defs>
                <linearGradient id="gradient" gradientTransform="rotate(90)">
                    <stop offset="0%" stopColor="#FF5733" />
                    <stop offset="20%" stopColor="#FFC300" />
                    <stop offset="40%" stopColor="#DAF7A6" />
                    <stop offset="60%" stopColor="#33FF57" />
                    <stop offset="80%" stopColor="#3380FF" />
                    <stop offset="100%" stopColor="#9D33FF" />
                </linearGradient>
            </defs>
            <circle className="bg"></circle>
            <circle className="fg"></circle>
        </svg>
    </div>
);


