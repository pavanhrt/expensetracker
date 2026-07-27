import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1530177150700-84cd9a3b059b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxib3RhbmljYWwlMjBjYWxtJTIwc2hhZG93JTIwbGVhZiUyMG1pbmltYWxpc3R8ZW58MHx8fHwxNzg1MTMzOTIxfDA&ixlib=rb-4.1.0&q=85')",
        backgroundSize: "cover", backgroundPosition: "center"
      }}>
        <div className="absolute inset-0 bg-[#1C1B1A]/25" />
        <div className="absolute bottom-10 left-10 right-10 text-[#F7F6F3]">
          <p className="text-xs tracking-[0.3em] uppercase opacity-80">Vartā · A conversation with your money</p>
          <h2 className="font-editorial text-5xl leading-none mt-4 font-light">Track what matters,<br/>with your voice.</h2>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[#F7F6F3]">
        <div className="w-full max-w-sm">
          <div className="flex items-baseline gap-2 mb-10">
            <span className="font-editorial text-4xl">Vartā</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#72706A]">Ledger</span>
          </div>
          <h1 className="font-editorial text-4xl mb-2 font-light">Welcome back.</h1>
          <p className="text-sm text-[#72706A] mb-10">Sign in to continue your ledger.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Email</Label>
              <Input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-11 bg-white border-[#E5E3DB]"
                autoComplete="email"
              />
            </div>
            <div>
              <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Password</Label>
              <Input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 h-11 bg-white border-[#E5E3DB]"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              data-testid="login-submit"
              disabled={loading}
              className="w-full h-11 bg-[#2C3627] hover:bg-[#1F281B] text-[#F7F6F3] rounded-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-[#72706A] mt-8">
            New here?{" "}
            <Link to="/signup" data-testid="link-signup" className="text-[#2C3627] underline underline-offset-4">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
