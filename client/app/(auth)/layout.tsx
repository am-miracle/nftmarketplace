import Image from "next/image";
import AuthBackground from "../../assets/authBack.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-full">
      <div className="w-full md:flex items-center 2xl:mx-auto 2xl:max-w-7xl 2xl:px-10">
        <div className="mb-4 md:mb-0 h-[232px] w-full md:w-1/2 md:h-[90%] xl:h-full overflow-hidden">
          <Image
            src={AuthBackground}
            alt="Background Image for Authentication"
            width={100}
            height={100}
            className="w-full h-[232px]"
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>
        <div className="w-full md:max-w-[450px]">
          {children}
        </div>
      </div>
    </main>
  );
}