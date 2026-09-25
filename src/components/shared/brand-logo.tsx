import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return <Image src="/branding/taskflow-v1.1/taskflow-logo-horizontal.png" alt="TaskFlow" width={1464} height={408} className={`h-auto w-[126px] ${className}`} priority />;
}
