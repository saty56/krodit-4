"use client";

import React, { useState, useEffect } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import RedirectIfAuth from "@/modules/dashboard/ui/components/auth/redirect-if-auth";
import { AuthLoadingOverlay } from "@/components/auth-loading-overlay";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";

interface SignUpFormFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTos?: boolean;
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SignUpFormFields>();
  const [statusMsg, setStatusMsg] = useState("");
  const [msgType, setMsgType] = useState<"error" | "success" | "">("");
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [socialProvider, setSocialProvider] = useState<string | null>(null);

  // Check if we're in an OAuth callback
  useEffect(() => {
    if (!searchParams) return;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code || state) {
      setIsOAuthCallback(true);
    }
  }, [searchParams]);

  const onSubmit = async (data: SignUpFormFields) => {
    setStatusMsg("");
    setMsgType("");
    if (data.password.length < 6) {
      setStatusMsg("Password too short (min 6 characters)");
      setMsgType("error");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setStatusMsg("Passwords do not match");
      setMsgType("error");
      return;
    }
    try {
      const result: any = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: (data.firstName + ' ' + data.lastName).trim(),
      });
      if (result && typeof result === "object" && result.error) {
        setStatusMsg(
          typeof result.error === "object" && "message" in result.error
            ? (result.error as any).message
            : String(result.error)
        );
        setMsgType("error");
        return;
      }
      setStatusMsg("Signup successful! Redirecting...");
      setMsgType("success");
      reset();
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: any) {
      let msg = err?.message || String(err);
      if (
        typeof msg === "string" &&
        (msg.toLowerCase().includes("invalid email") || msg.toLowerCase().includes("emailandpassword"))
      ) {
        setStatusMsg("Invalid email and password combination.");
      } else {
        setStatusMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      setMsgType("error");
    }
  };

  const messageBoxStyle: React.CSSProperties =
    msgType === "success"
      ? { color: "#166534", background: "#dcfce7", padding: '10px', borderRadius: '8px', marginBottom: '8px', fontWeight: 500, textAlign: 'center' }
      : msgType === "error"
      ? { color: "#b91c1c", background: "#fee2e2", padding: '10px', borderRadius: '8px', marginBottom: '8px', fontWeight: 500, textAlign: 'center' }
      : {};
  const errorStyle = { color: "#be123c", fontSize: 13, marginBottom: 10, display: 'block' };

  // Show loading overlay during OAuth callback to prevent page blink
  if (isOAuthCallback) {
    return <AuthLoadingOverlay message="Taking you to dashboard..." fullScreen />;
  }

  return (
    <RedirectIfAuth>
    <section className="signin-shell signin-theme-teal">
      <div className="signin-card signup-card">
        <div className="card-gradient-border" />
        <div className="card-inner">
          <div className="pane left">
            <div className="card-header center">
              <div className="header-text">
                <h1>Create your account</h1>
                <p>Sign up to continue</p>
              </div>
            </div>
            <form className="form" onSubmit={handleSubmit(onSubmit)}>
              {statusMsg && (
                <div style={messageBoxStyle}>
                  {statusMsg}
                </div>
              )}
              <div className="field-row">
                <div style={{ marginBottom: 4 }}>
                  <div className="field">
                    <span className="icon">👤</span>
                    <input
                      type="text"
                      placeholder="First name"
                      style={errors.firstName ? { borderColor: "#be123c", background: "#fef2f2" } : {}}
                      {...register("firstName", { required: "First name is required" })}
                    />
                  </div>
                  {errors.firstName && <span style={errorStyle}>{errors.firstName.message}</span>}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div className="field">
                    <span className="icon">👤</span>
                    <input
                      type="text"
                      placeholder="Last name"
                      style={errors.lastName ? { borderColor: "#be123c", background: "#fef2f2" } : {}}
                      {...register("lastName", { required: "Last name is required" })}
                    />
                  </div>
                  {errors.lastName && <span style={errorStyle}>{errors.lastName.message}</span>}
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div className="field">
                  <span className="icon">@</span>
                  <input
                    type="email"
                    placeholder="Email address"
                    style={errors.email ? { borderColor: "#be123c", background: "#fef2f2" } : {}}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email"
                      },
                    })}
                  />
                </div>
                {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
              </div>
              <div style={{ marginBottom: 4 }}>
                <div className="field">
                  <span className="icon">••</span>
                  <input
                    type="password"
                    placeholder="Password"
                    style={errors.password ? { borderColor: "#be123c", background: "#fef2f2" } : {}}
                    {...register("password", { required: "Password is required" })}
                  />
                </div>
                {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
              </div>
              {/* Confirm Password */}
              <div style={{ marginBottom: 4 }}>
                <div className="field">
                  <span className="icon">••</span>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    style={
                      errors.confirmPassword ? { borderColor: "#be123c", background: "#fef2f2" } : {}
                    }
                    {...register("confirmPassword", { required: "Please confirm your password" })}
                  />
                </div>
                {errors.confirmPassword && (
                  <span style={errorStyle}>{errors.confirmPassword.message}</span>
                )}
              </div>
              <button type="submit" className="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing up..." : "Sign up"}
              </button>
              <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
                <div style={{ flex: 1, height: 2, background: "#bbbfc4", borderRadius: 1 }} />
                <span style={{
                  margin: "0 16px",
                  background: "#fff",
                  padding: "2px 18px",
                  borderRadius: "999px",
                  fontSize: 12,
                  color: "#575a60",
                  border: "1px solid #bbbfc4",
                  fontWeight: 500
                }}>or sign up with</span>
                <div style={{ flex: 1, height: 2, background: "#bbbfc4", borderRadius: 1 }} />
              </div>
              <div className="socials">
                <button
                  type="button" 
                  disabled={isSocialLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSocialLoading(true);
                    setSocialProvider("google");
                    authClient.signIn.social({ provider: "google" });
                  }}
                >
                  <FaGoogle />                
                  </button>
                <button
                  type="button" 
                  disabled={isSocialLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSocialLoading(true);
                    setSocialProvider("github");
                    authClient.signIn.social({ provider: "github" });
                  }}
                >
                  <FaGithub />
                </button>
              </div>
              {/* Show loading overlay when social button is clicked */}
              {isSocialLoading && (
                <AuthLoadingOverlay message={
                  socialProvider === "google"
                    ? "Opening Google..."
                    : socialProvider === "github"
                    ? "Opening GitHub..."
                    : "Redirecting to provider..."
                } />
              )}
              <div className="card-footer">
                <span>Already have an account?</span>
                <a href="/sign-in">Sign in</a>
              </div>
            </form>
          </div>
          <div className="v-divider" />
          <div className="pane right">
            <img src="/file.svg" alt="Krodit Logo" className="signin-logo" />
          </div>
        </div>
      </div>
    </section>
    </RedirectIfAuth>
  );
}


