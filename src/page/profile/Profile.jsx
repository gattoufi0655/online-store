import { useState } from "react";
import { FaArrowRight, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../components/context/AuthState";
import "./profile.css";

function Profile() {
  const { user, loading, authError, refreshUser, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLogoutError("");
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleRetry = () => {
    refreshUser().catch((error) => {
      console.error("Erreur lors du rechargement du profil :", error);
    });
  };

  if (loading) {
    return (
      <main className="profile_page" aria-live="polite">
        <p className="profile_message">Chargement de votre profil...</p>
      </main>
    );
  }

  if (authError && !user) {
    return (
      <main className="profile_page">
        <section className="profile_card">
          <p className="profile_error" role="alert">{authError}</p>
          <button className="profile_button" onClick={handleRetry}>
            Réessayer
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Non renseignée";

  return (
    <PageTransition>
      <main className="profile_page">
        <section className="profile_card" aria-labelledby="profile-title">
          <div className="profile_intro">
            <span className="profile_avatar" aria-hidden="true">
              <FaUserCircle />
            </span>
            <span className="profile_eyebrow">ESPACE CLIENT</span>
            <h1 id="profile-title">Bonjour, {user.nom}</h1>
            <p>Retrouvez ici les informations de votre compte.</p>
          </div>

          <div className="profile_details">
            <h2>Mon profil</h2>
            <dl>
              <div>
                <dt>Nom</dt>
                <dd>{user.nom}</dd>
              </div>
              <div>
                <dt>Adresse e-mail</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Membre depuis</dt>
                <dd>{createdAt}</dd>
              </div>
            </dl>

            {logoutError && (
              <p className="profile_error" role="alert">{logoutError}</p>
            )}

            <div className="profile_actions">
              <Link className="profile_button profile_button_secondary" to="/">
                Continuer mes achats <FaArrowRight />
              </Link>
              <button
                className="profile_button"
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <FaSignOutAlt />
                {loggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}

export default Profile;
