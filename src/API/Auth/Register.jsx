import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCheck, FaShieldAlt } from "react-icons/fa";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../components/context/AuthState";
import { API_URL } from "../api";
import "./register.css";

function Register() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Le mot de passe est trop long.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const firstName = formData.get("firstName")?.toString().trim() || "";
    const lastName = formData.get("lastName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const nom = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !email) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nom,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la création du compte.");
        return;
      }

      setUser(data.user);
      setSubmitted(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Erreur inscription :", err);
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
        <section
          className="register_card"
          aria-labelledby="register-title"
        >
          <div className="register_intro">
            <span className="register_eyebrow">
              BIENVENUE CHEZ BLUE
            </span>

            <h1 id="register-title">Créez votre compte</h1>

            <p>
              Inscrivez-vous pour retrouver vos favoris et suivre vos
              commandes.
            </p>

            <div className="register_perks">
              <span>
                <FaCheck /> Une expérience shopping personnalisée
              </span>
              <span>
                <FaCheck /> Vos produits favoris toujours à portée de main
              </span>
              <span>
                <FaShieldAlt /> Vos informations restent protégées
              </span>
            </div>
          </div>

          <div className="register_form_wrap">
            {submitted ? (
              <div className="register_success" role="status">
                <span className="register_success_icon">
                  <FaCheck />
                </span>

                <h2>Compte créé avec succès !</h2>

                <p>
                  Votre compte est créé. Votre profil est prêt.
                </p>

                <Link className="register_submit" to="/profile">
                  Voir mon profil <FaArrowRight />
                </Link>
              </div>
            ) : (
              <>
                <div className="register_form_heading">
                  <h2>Inscription</h2>
                  <p>Les champs marqués d’un * sont obligatoires.</p>
                </div>

                <form
                  className="register_form"
                  onSubmit={handleSubmit}
                >
                  <div className="register_name_fields">
                    <label>
                      Prénom *
                      <input
                        autoComplete="given-name"
                        name="firstName"
                        placeholder="Votre prénom"
                        required
                      />
                    </label>

                    <label>
                      Nom *
                      <input
                        autoComplete="family-name"
                        name="lastName"
                        placeholder="Votre nom"
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Adresse e-mail *
                    <input
                      autoComplete="email"
                      name="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </label>

                  <label>
                    Mot de passe *
                    <input
                      autoComplete="new-password"
                      name="password"
                      type="password"
                      minLength={8}
                      placeholder="8 caractères minimum"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Confirmer le mot de passe *
                    <input
                      autoComplete="new-password"
                      name="confirmPassword"
                      type="password"
                      minLength={8}
                      placeholder="Saisissez à nouveau le mot de passe"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="register_terms">
                    <input
                      type="checkbox"
                      name="terms"
                      required
                    />
                    <span>
                      J’accepte les conditions d’utilisation et la
                      politique de confidentialité. *
                    </span>
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
                    {loading
                      ? "Création du compte..."
                      : "Créer mon compte"}
                    {!loading && <FaArrowRight />}
                  </button>
                </form>

                <p className="register_login">
                  Vous avez déjà un compte ?{" "}
                  <Link to="/login">Se connecter</Link>
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </PageTransition>
  );
}

export default Register;
