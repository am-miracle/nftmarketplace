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
import Link from "next/link";
import CustomButton from "@/components/custom/CustomButton";
import CustomInput from "@/components/custom/CustomInput";
import { Lock, Mail, User } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (
      formData.password!== formData.confirmPassword ||
      formData.password.length < 8 ||
      formData.email.indexOf("@") === -1 ||
      formData.username.length < 3
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        username: formData.username,
      });

      if (result.status === "complete") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        router.push("/verify-email");
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
        <CardTitle className="text-4xl md:text-3xl xl:text-4xl">Create an account</CardTitle>
        <CardDescription className="text-xl md:text-lg xl:text-xl">
          Welcome! enter your details and start creating, collecting and selling NFTs.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <CustomInput
            name="username"
            type="text"
            placeholder="johndoe"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            isLoading={isLoading}
            icon={<User size={20} className="mr-2 h-5 w-5 text-icon" />}
          />
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
          <CustomInput
            name="password"
            type="password"
            placeholder="confirm password"
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
        <CardFooter className="flex flex-col gap-4 mt-3">
          <CustomButton
            title="Sign up"
            className="bg-accent w-full"
            isLoading={isLoading}
            type="submit"
          />
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}