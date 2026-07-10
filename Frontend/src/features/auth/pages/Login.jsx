import { SignIn } from "@clerk/react";
import { dark } from "@clerk/themes";
import "../auth.page.scss";

const Login = () => {
  return (
    <main className="auth-page">
      <div className="auth-page__container">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "cl-rootBox",
              card: "cl-card",
              formButtonPrimary: "cl-formButtonPrimary",
              footer: "cl-footer",
              footerAction: "cl-footerAction",
              footerActionText: "cl-footerActionText",
              footerActionLink: "cl-footerActionLink",
              headerTitle: "cl-headerTitle",
              headerSubtitle: "cl-headerSubtitle",
              formFieldLabel: "cl-formFieldLabel",
              formFieldInput: "cl-formFieldInput",
              socialButtonsBlockButtonText: "cl-socialButtonsBlockButtonText",
              dividerText: "cl-dividerText",
              providerIcon: "cl-providerIcon",
              logoImage: "cl-logoImage",
            },
          }}
        />
      </div>
    </main>
  );
};

export default Login;
