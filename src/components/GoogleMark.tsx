import type { SVGProps } from 'react';

export function GoogleMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21.805 12.23c0-.78-.07-1.53-.22-2.25H12v4.26h5.49a4.7 4.7 0 0 1-2.04 3.08v2.57h3.31c1.94-1.79 3.05-4.43 3.05-7.66Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.77 0 5.1-.92 6.8-2.49l-3.31-2.57c-.92.62-2.1.99-3.49.99-2.68 0-4.96-1.81-5.78-4.24H2.8v2.65A10.27 10.27 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.22 13.69a6.17 6.17 0 0 1 0-3.38V7.66H2.8a10 10 0 0 0 0 8.68l3.42-2.65Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.07c1.51 0 2.86.52 3.93 1.54l2.95-2.95C17.1 3.04 14.77 2 12 2a10.27 10.27 0 0 0-9.2 5.66l3.42 2.65C7.04 7.88 9.32 6.07 12 6.07Z"
        fill="#EA4335"
      />
    </svg>
  );
}
