import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/(auth)/login/_components/LoginForm";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useLogin: () => ({ mutateAsync: jest.fn(), isPending: false, isError: false }),
}));

jest.mock("@/lib/api/apiClient", () => ({ authClient: { signIn: { social: jest.fn() } } }));

describe("LoginForm", () => {
  it("renders fields and actions", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sso login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits form when clicking sign in (noop in test)", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  });
});
