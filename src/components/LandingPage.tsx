import type { FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onOpenMercadito: () => void;
}

export function LandingPage({ onOpenMercadito }: LandingPageProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onOpenMercadito();
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Mercadona, inicio">
          <svg className="landing-brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="#fff" stroke="#e4e8df" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="13.5" fill="#f6c844" />
            <path
              d="M11 25V15l5 5 4-5 4 5 5-5v10"
              fill="none"
              stroke="#087a45"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
          <span>MERCADONA</span>
        </a>

        <nav className="landing-navigation" aria-label="Navegación principal">
          <span>Conócenos</span>
          <span>Supermercados</span>
          <button type="button" onClick={onOpenMercadito} className="landing-nav-link">
            MercadITo
          </button>
          <span>Trabaja con nosotros</span>
          <span>Atención al cliente</span>
        </nav>

        <div className="landing-language" aria-label="Idioma seleccionado: Español">
          <span>Español</span>
          <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-image" role="img" aria-label="Frutas y verduras frescas" />
        <section className="landing-hero-content" aria-labelledby="landing-title">
          <div className="landing-intro">
            <h1 id="landing-title">Empieza tu compra<br />en Mercadona</h1>
            <p>
              Introduce tu código postal y dependiendo de tu ciudad accederás a la nueva compra
              online o a la web clásica.
            </p>
            <form className="landing-postal-form" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="landing-postal-code">
                Código postal
              </label>
              <input
                id="landing-postal-code"
                name="postalCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                pattern="[0-9]{5}"
                placeholder="Código postal"
                required
              />
              <button type="submit">ENTRAR</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
