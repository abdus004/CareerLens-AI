import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const user = { email: "student@example.com" };
const session = { access_token: "access", refresh_token: "refresh", expires_at: 9999999999 };

async function renderRoutes(authenticated) {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  const manager = await import("../../utils/session");
  if (authenticated) manager.saveSession(user, session, true);
  const ProtectedRoute = (await import("./ProtectedRoute")).default;
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<ProtectedRoute><p>Protected dashboard</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => vi.unstubAllGlobals());

describe("ProtectedRoute", () => {
  it("redirects an unauthenticated visitor to login", async () => {
    await renderRoutes(false);
    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
  });

  it("renders an authenticated visitor's intended route", async () => {
    await renderRoutes(true);
    await waitFor(() => expect(screen.getByText("Protected dashboard")).toBeInTheDocument());
  });
});
