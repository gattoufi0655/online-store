import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight, FaBoxOpen, FaHeart, FaShieldAlt } from "react-icons/fa";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../components/context/AuthState";
import { API_URL } from "../api";
import "./login.css";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la connexion.");
        return;
      }

      setUser(data.user);
      setUserName(data.user.nom);
      navigate("/profile", { replace: true });
    } catch (requestError) {
      console.error("Erreur connexion :", requestError);
      setError(
        "Impossible de contacter le serveur. Vérifiez que le backend fonctionne."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="register_page">
        <section className="register_card login_card" aria-labelledby="login-title">
          <div className="register_intro">
            <span className="register_eyebrow">HEUREUX DE VOUS REVOIR</span>
            <h1 id="login-title">Ravi de vous retrouver.</h1>
            <p>Connectez-vous pour profiter pleinement de votre espace client.</p>

            <div className="register_perks">
              <span><FaBoxOpen /> Suivez facilement vos commandes</span>
              <span><FaHeart /> Retrouvez vos produits favoris</span>
              <span><FaShieldAlt /> Connexion sécurisée</span>
            </div>
          </div>

          <div className="register_form_wrap">
            {userName ? (
              <div className="register_success" role="status">
                <span className="register_success_icon"><FaShieldAlt /></span>
                <h2>Connexion réussie</h2>
                <p>
                  Ravi de vous retrouver, {userName}.
                </p>
                <Link className="register_submit" to="/profile">
                  Voir mon profil <FaArrowRight />
                </Link>
              </div>
            ) : (
              <>
                <div className="register_form_heading">
                  <h2>Connexion</h2>
                  <p>Saisissez les identifiants de votre compte.</p>
                </div>

                <form className="register_form login_form" onSubmit={handleSubmit}>
                  <label>
                    Adresse e-mail
                    <input autoComplete="email" name="email" type="email" placeholder="vous@exemple.com" required />
                  </label>

                  <label>
                    Mot de passe
                    <input autoComplete="current-password" name="password" type="password" placeholder="Votre mot de passe" required />
                  </label>

                  {error && (
                    <p className="register_error" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    className="register_submit"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                    {!loading && <FaArrowRight />}
                  </button>
                </form>

                <p className="register_login">
                  Vous n’avez pas encore de compte ? <Link to="/register">Créer un compte</Link>
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </PageTransition>
  );
}

export default Login;