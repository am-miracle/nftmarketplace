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
import toast from "react-hot-toast";

export default function SignUpPage() {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // const [verifying, setVerifying] = useState(false)
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
      formData.password.length < 8
    ) {
      return toast.error("Password not the same as confirm password");
    }
    if (!formData.email.match(/.+@.+\..+/)) {
      return toast.error("Invalid email address");
    }
    if (formData.username.length < 3) {
      return toast.error("Username must be at least 3 characters long");
    }

    try {
      setIsLoading(true);
      setError("");

      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        username: formData.username,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      toast.success("Sign up successful, please check your email for verification");
      router.refresh();
      router.push("/verify-email");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      console.error(JSON.stringify(err, null, 2))
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
            name="confirm_password"
            type="password"
            placeholder="confirm password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            isLoading={isLoading}
            icon={<Lock size={20} className="mr-2 h-5 w-5 text-icon" />}
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-500">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-3">
          {/* CAPTCHA Widget */}
          <div id="clerk-captcha"></div>
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