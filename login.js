const loginForm = document.querySelector("#loginForm");
const loginEmailInput = document.querySelector("#loginEmail");
const loginPasswordInput = document.querySelector("#loginPassword");
const loginFeedback = document.querySelector("#loginFeedback");

// A autenticação real será implementada na próxima etapa.
// Por enquanto esta tela apenas valida o preenchimento básico dos campos.
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginEmailInput ? loginEmailInput.value.trim() : "";
    const senha = loginPasswordInput ? loginPasswordInput.value.trim() : "";

    if (!loginFeedback) {
      return;
    }

    if (!email || !senha) {
      loginFeedback.textContent = "Preencha e-mail e senha para continuar.";
      return;
    }

    loginFeedback.textContent = "Autenticação será implementada na próxima etapa.";
  });
}
