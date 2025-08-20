
import React from 'react';

const Logo: React.FC = () => (
  <div className="flex items-center space-x-3">
    <div className="bg-orange-600 p-2 rounded-md flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <style>
              {`
                .f { fill: white; font-family: Montserrat, sans-serif; font-weight: bold; font-size: 60px; }
                .sq { fill: white; }
              `}
            </style>
            <text x="2" y="68" className="f">2i</text>
            <g transform="translate(60, 15)">
                <rect className="sq" x="0" y="0" width="12" height="12"/>
                <rect className="sq" x="15" y="0" width="12" height="12"/>
                <rect className="sq" x="0" y="15" width="12" height="12"/>
                <rect className="sq" x="15" y="15" width="12" height="12"/>
                <rect className="sq" x="0" y="30" width="12" height="12"/>
                <rect className="sq" x="15" y="30" width="12" height="12"/>
                <rect className="sq" x="0" y="45" width="12" height="12"/>
                <rect className="sq" x="15" y="45" width="12" height="12"/>
            </g>
        </svg>
    </div>
    <div className="flex flex-col">
        <span className="text-xl font-bold text-white">2ia</span>
        <span className="text-xs text-neutral-300 -mt-1">Sistemas e Tecnologia</span>
    </div>
  </div>
);

export default Logo;
