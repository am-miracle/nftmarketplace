"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomInput from "@/components/custom/CustomInput";
import CustomButton from "@/components/custom/CustomButton";

export default function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError("");

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        console.log(result);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-none my-8 md:my-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-4xl md:text-3xl xl:text-4xl">Verify your email</CardTitle>
        <CardDescription className="text-xl md:text-lg xl:text-xl">
          Enter the verification code sent to your email
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent>
          <CustomInput
            name="code"
            placeholder="Enter verification code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            isLoading={isLoading}
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-500 mt-2">{error}</p>
          )}
        </CardContent>
        <CardFooter>
          <CustomButton
            type="submit"
            className="w-full mt-3"
            isLoading={isLoading}
            title="Verify Email"
          />
        </CardFooter>
      </form>
    </Card>
  );
}