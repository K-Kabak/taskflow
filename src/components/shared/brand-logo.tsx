import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return <span className={`relative inline-block w-[126px] shrink-0 ${className}`}>
    <Image src="/branding/taskflow-v1.1/taskflow-logo-horizontal.png" alt="TaskFlow" width={1464} height={408} className="block h-auto w-full" priority />
    <Image src="/branding/taskflow-v1.1/taskflow-logo-horizontal.png" alt="" aria-hidden="true" width={1464} height={408} className="tf-logo-light-text pointer-events-none absolute inset-0 h-auto w-full" />
  </span>;
}
