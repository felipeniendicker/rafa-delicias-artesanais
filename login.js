const loginForm = document.querySelector("#loginForm");
const loginEmailInput = document.querySelector("#loginEmail");
const loginPasswordInput = document.querySelector("#loginPassword");
const loginFeedback = document.querySelector("#loginFeedback");
const ADMIN_TOKEN_STORAGE_KEY = "rafaDeliciasAdminToken";

function atualizarFeedbackLogin(mensagem) {
  if (loginFeedback) {
    loginFeedback.textContent = mensagem;
  }
}

async function realizarLogin(email, senha) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const data = await response.json();

  if (!response.ok || !data?.sucesso || !data?.token) {
    throw new Error(data?.mensagem || "Não foi possível realizar o login agora.");
  }

  return data;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginEmailInput ? loginEmailInput.value.trim() : "";
    const senha = loginPasswordInput ? loginPasswordInput.value.trim() : "";

    if (!email || !senha) {
      atualizarFeedbackLogin("Preencha e-mail e senha para continuar.");
      return;
    }

    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    atualizarFeedbackLogin("Entrando...");

    try {
      const data = await realizarLogin(email, senha);

      // O token fica salvo no navegador para ser enviado nas rotas administrativas protegidas.
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
      atualizarFeedbackLogin(data.mensagem || "Login realizado com sucesso.");
      window.location.href = "/admin";
    } catch (error) {
      atualizarFeedbackLogin(error.message || "Não foi possível realizar o login agora.");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });
}
