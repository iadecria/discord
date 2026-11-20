import React, { type JSX } from 'react';

/**
 * The QGdeCRIA mark as an inline icon that takes the text colour, in the
 * 24px box the other navigation icons use. The path is the one in
 * `assets/brand/mark-mono-light.svg` (and `public/icons/logo-mark.svg`);
 * its 111.36x63.03 artwork is centred in a square view box so it sits like
 * the square icons beside it. Decorative: the label next to it names the
 * destination.
 */
export function BackspaceMark(props: { size?: number; className?: string }): JSX.Element {
  const { size = 24, className } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 111.36 63.03"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M36.64 51.69c-1.87,0.56 -3.86,0.86 -5.92,0.86 -11.33,0 -20.51,-9.18 -20.51,-20.52 0,-11.33 9.18,-20.52 20.51,-20.52 11.34,0 20.52,9.19 20.52,20.52 0,6.47 0.01,9.07 3.45,15.23 14.61,26.22 61.19,16.69 56.31,-21.13l-30.34 -0.18 0.04 10.83 19.4 0c-4.28,15.45 -23.66,19.49 -33.94,9.46 -7.63,-7.44 -3.02,-11.17 -4.92,-20.45 -2.42,-11.83 -11.67,-24.97 -31.28,-24.61 -18.57,0.35 -33.88,17.71 -29.06,37.8 2.14,8.93 8.05,15.65 14.38,19.1 10.47,5.71 16.19,4.65 27.43,1.71l2.41 3.21 14.61 0.03 -26.65 -34.01 -8.44 6.66 12 16.01z"/>
      <path d="M80.45 0.01c19.06,-0.38 25.89,13.88 25.89,13.88l-8.83 5.48c0,0 -5.71,-9.45 -17.06,-8.83 -8.37,0.45 -12.76,3.26 -16.5,8.3l-5.57 -9.63c5.63,-5.68 13.44,-9.03 22.07,-9.2z"/>
      <path d="M30.95 15.46l-4.73 6.84 -5.06 -3.03c-0.11,-0.05 -1.55,0.37 -1.67,0.43l2.66 9.56 1.63 -0.46 2.86 -4.09c1.44,0.88 2.86,1.79 4.31,2.66 1.45,-0.87 2.87,-1.78 4.31,-2.66l2.86 4.09 1.63 0.46 2.66 -9.56c-0.12,-0.06 -1.57,-0.48 -1.67,-0.43l-5.06 3.03 -4.73 -6.84 0 0zm0 9.83l-0.1 0.07c-1.09,-0.67 -2.17,-1.33 -3.24,-2.03l3.34 -4.85 3.34 4.85c-1.07,0.7 -2.15,1.36 -3.24,2.03l-0.1 -0.07zm5.82 -1.53l1.91 2.86c0.16,-0.11 1.21,-4.37 1.36,-4.92l-3.27 2.06zm-11.64 0l-1.91 2.86c-0.17,-0.11 -1.21,-4.37 -1.36,-4.92l3.27 2.06z"/>
      <polygon points="42.71,59.79 57.19,59.79 59.73,63.03 45.12,63.03"/>
    </svg>
  );
}
