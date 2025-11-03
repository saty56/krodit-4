"use client";

import React, { useState } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import RedirectIfAuth from "@/modules/dashboard/ui/components/auth/redirect-if-auth";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";

interface SignInFormFields {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export default function SignInPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SignInFormFields>();
  const [statusMsg, setStatusMsg] = useState("");
  const [msgType, setMsgType] = useState<"error" | "success" | "">("");

  const onSubmit = async (data: SignInFormFields) => {
    setStatusMsg("");
    setMsgType("");
    if (data.password && data.password.length < 6) {
      setStatusMsg("Password too short (min 6 characters)");
      setMsgType("error");
      return;
    }
    try {
      const result: any = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      console.log("Sign-in result:", result);
      if (result && typeof result === "object" && result.error) {
        setStatusMsg(
          typeof result.error === "object" && "message" in result.error
            ? (result.error as any).message
            : String(result.error)
        );
        setMsgType("error");
        return;
      }
      setStatusMsg("Sign in successful! Redirecting...");
      setMsgType("success");
      reset();
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: any) {
      let msg = err?.message || String(err);
      if (
        typeof msg === "string" &&
        (msg.toLowerCase().includes("invalid email") ||
         msg.toLowerCase().includes("emailandpassword"))
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

  return (
    <RedirectIfAuth>
    <section className="signin-shell signin-theme-blue">
      <div className="signin-card">
        <div className="card-gradient-border" />
        <div className="card-inner">
          <div className="pane left">
            <div className="card-header center">
              <div className="header-text">
                <h1>Welcome back</h1>
                <p>Sign in to continue</p>
              </div>
            </div>
            <form className="form" onSubmit={handleSubmit(onSubmit)}>
              {statusMsg && (
                <div style={messageBoxStyle}>
                  {statusMsg}
                </div>
              )}
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
                  <a className="field-action" href="#">Forgot?</a>
                </div>
                {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
              </div>
              <button type="submit" className="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
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
                }}>or sign in with</span>
                <div style={{ flex: 1, height: 2, background: "#bbbfc4", borderRadius: 1 }} />
              </div>
              <div className="socials">
                <button 
                  type="button" 
                  onClick={() => authClient.signIn.social({ provider: "google" })}
                >
                  <FaGoogle />
                </button>
                <button 
                  type="button"
                  onClick={() => authClient.signIn.social({ provider: "github" })}
                >
                  <FaGithub />
                  </button>
              </div>
              <div className="card-footer">
                <span>New here?</span>
                <a href="/sign-up">Create an account</a>
              </div>
            </form>
          </div>
          <div className="v-divider" />
          <div className="pane right">
            <img src="/m.png" alt="Krodit Logo" className="signin-logo" />
          </div>
        </div>
      </div>
    </section>
    </RedirectIfAuth>
  );
}


