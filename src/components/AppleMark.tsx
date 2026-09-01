import type { SVGProps } from 'react';

export function AppleMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M17.05 12.54c-.02-2.33 1.9-3.46 1.99-3.52a4.28 4.28 0 0 0-3.37-1.82c-1.42-.15-2.78.85-3.5.85-.73 0-1.85-.83-3.04-.81a4.48 4.48 0 0 0-3.77 2.3c-1.63 2.82-.41 6.98 1.17 9.26.79 1.12 1.7 2.37 2.91 2.33 1.17-.05 1.61-.75 3.02-.75 1.41 0 1.81.75 3.03.72 1.26-.02 2.05-1.13 2.81-2.26a9.28 9.28 0 0 0 1.28-2.62 4.06 4.06 0 0 1-2.53-3.68ZM14.76 5.71a4.1 4.1 0 0 0 .94-2.94 4.17 4.17 0 0 0-2.7 1.4 3.9 3.9 0 0 0-.97 2.83 3.44 3.44 0 0 0 2.73-1.29Z" />
    </svg>
  );
}
