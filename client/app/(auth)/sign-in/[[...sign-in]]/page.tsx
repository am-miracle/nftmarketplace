"use client";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import CustomInput from "@/components/custom/CustomInput";
import { Lock, Mail } from "lucide-react";
import CustomButton from "@/components/custom/CustomButton";
import toast from "react-hot-toast";

export default function SignInPage() {
  const { isLoaded, signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError("");

      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === "complete") {
        window.location.href = "/";
        toast.success("Signed in successfully");
      } else {
        setError(result.status || "error");
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
    <Card className="border-none ">
      <CardHeader className="space-y-1">
        <CardTitle className="text-4xl md:text-3xl xl:text-4xl">Welcome back</CardTitle>
        <CardDescription className="text-xl md:text-lg xl:text-xl">
          Enter your credentials to sign in
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <CustomInput
            placeholder="example@domain.com"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            isLoading={isLoading}
            icon={<Mail size={20} className="mr-2 h-5 w-5 text-icon" />}
          />
          <CustomInput
            name="password"
            type="password"
            placeholder="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            isLoading={isLoading}
            icon={<Lock size={20} className="mr-2 h-5 w-5 text-icon" />}
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-500">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <CustomButton
            title="Sign in"
            className="bg-accent w-full"
            isLoading={isLoading}
            type="submit"
          />
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}