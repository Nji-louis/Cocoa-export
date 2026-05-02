(function (global) {
  const ns = global.AppBackend || {};

  function setStatus(message, isError) {
    const node = document.getElementById("admin-login-status");
    if (node == null) return;
    node.textContent = message || "";
    node.className = isError ? "alert alert-danger auth-status" : "alert alert-info auth-status";
    node.style.display = message ? "block" : "none";
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      setStatus("Signing in...", false);
      await ns.authApi.signIn(
        document.getElementById("admin-login-email").value.trim(),
        document.getElementById("admin-login-password").value,
      );
      const user = await ns.authApi.getUser();
      const roles = await ns.authApi.getMyRoles(user);
      const adminRoles = ["super_admin", "admin", "editor", "staff"];
      const hasAdminAccess = (roles || []).some(function (role) {
        return adminRoles.indexOf(String(role).toLowerCase()) >= 0;
      });
      if (hasAdminAccess === false) {
        await ns.authApi.signOut().catch(function () { return null; });
        throw new Error("This account does not have admin dashboard access yet. Ask a super admin to assign your role.");
      }
      global.location.href = "dashboard.html";
    } catch (error) {
      setStatus(error.message || "Unable to sign in.", true);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    try {
      const fullName = document.getElementById("admin-signup-name").value.trim();
      const email = document.getElementById("admin-signup-email").value.trim();
      const company = document.getElementById("admin-signup-company").value.trim();
      const password = document.getElementById("admin-signup-password").value;
      await ns.authApi.signUp(email, password, fullName, global.location.origin + global.location.pathname);
      setStatus("Access request created. Confirm your email. A super admin must still assign your dashboard role.", false);
      event.target.reset();
    } catch (error) {
      setStatus(error.message || "Access request failed.", true);
    }
  }

  async function handleForgotPassword() {
    try {
      const email = document.getElementById("admin-login-email").value.trim();
      if (email === "") {
        throw new Error("Enter your email first.");
      }
      await ns.authApi.resetPassword(email, global.location.origin + global.location.pathname);
      setStatus("Password reset email sent.", false);
    } catch (error) {
      setStatus(error.message || "Reset request failed.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("admin-login-form").addEventListener("submit", function (event) {
      void handleLogin(event);
    });
    document.getElementById("admin-signup-form").addEventListener("submit", function (event) {
      void handleSignup(event);
    });
    document.getElementById("admin-forgot-btn").addEventListener("click", function () {
      void handleForgotPassword();
    });
  });
})(window);
