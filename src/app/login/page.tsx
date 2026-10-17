import { isRegistrationOpen } from "@/lib/registration";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return <LoginForm registrationOpen={isRegistrationOpen()} />;
}
