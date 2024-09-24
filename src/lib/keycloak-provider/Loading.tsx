import React from "react";

export const LoadingScreenSample = () => (
    <div style={{height: "100vh", width: "100vw", display: 'flex', justifyContent: "center", alignItems: "center"}}>
        <svg width="200" height="200" viewBox="0 0 100 100">
            <g transform="rotate(0 50 50)">
                <path d="M 50 50 L 50 5 A 45 45 0 0 1 82.5 17.5 Z" fill="black"/>
                <path d="M 50 50 L 82.5 17.5 A 45 45 0 0 1 95 50 Z" fill="pink"/>
                <path d="M 50 50 L 95 50 A 45 45 0 0 1 82.5 82.5 Z" fill="black"/>
                <path d="M 50 50 L 82.5 82.5 A 45 45 0 0 1 50 95 Z" fill="pink"/>
                <path d="M 50 50 L 50 95 A 45 45 0 0 1 17.5 82.5 Z" fill="black"/>
                <path d="M 50 50 L 17.5 82.5 A 45 45 0 0 1 5 50 Z" fill="pink"/>
                <path d="M 50 50 L 5 50 A 45 45 0 0 1 17.5 17.5 Z" fill="black"/>
                <path d="M 50 50 L 17.5 17.5 A 45 45 0 0 1 50 5 Z" fill="pink"/>
                <circle cx="50" cy="50" r="35" fill="white"/>
                <text x="50%" y="50%" textAnchor="middle" fontSize="12">
                    <tspan dy="-0.4em">Keycloak</tspan>
                    <tspan x="50%" y="60%">connecting</tspan>
                </text>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="30 50 50"
                    dur="1s"
                    repeatCount="indefinite"
                    begin="0s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="30 50 50"
                    to="-10 50 50"
                    dur="0.6s"
                    repeatCount="indefinite"
                    begin="1s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="-10 50 50"
                    to="5 50 50"
                    dur="0.1s"
                    repeatCount="indefinite"
                    begin="1.6s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="5 50 50"
                    to="-2 50 50"
                    dur="0.05s"
                    repeatCount="indefinite"
                    begin="1.7s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="-2 50 50"
                    to="1 50 50"
                    dur="0.02s"
                    repeatCount="indefinite"
                    begin="1.75s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="1 50 50"
                    to="180 50 50"
                    dur="0.8s"
                    repeatCount="indefinite"
                    begin="1.8s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="180 50 50"
                    to="170 50 50"
                    dur="0.1s"
                    repeatCount="indefinite"
                    begin="2.6s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="170 50 50"
                    to="185 50 50"
                    dur="0.05s"
                    repeatCount="indefinite"
                    begin="2.7s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="185 50 50"
                    to="178 50 50"
                    dur="0.02s"
                    repeatCount="indefinite"
                    begin="2.75s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="178 50 50"
                    to="0 50 50"
                    dur="1.2s"
                    repeatCount="indefinite"
                    begin="2.8s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="10 50 50"
                    dur="0.1s"
                    repeatCount="indefinite"
                    begin="3.8s"
                />
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="-20 50 50"
                    to="70 50 50"
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin="3.9s"

                />
                {/*<animateTransform*/}
                {/*    attributeName="transform"*/}
                {/*    type="rotate"*/}
                {/*    from="5 50 50"*/}
                {/*    to="8 50 50"*/}
                {/*    dur="1s"*/}
                {/*    repeatCount="indefinite"*/}
                {/*    begin="3.95s"*/}
                {/*/>*/}

            </g>
        </svg>


    </div>
);


