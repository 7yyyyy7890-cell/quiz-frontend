import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { ar } from '../i18n/ar';
import '../styles/pages.css';

export default function Home() {
  return (
    <section className="page home-page">
      <div className="home-hero">
        <Logo size={80} />
        <h1>{ar.home.title}</h1>
        <p className="lead">{ar.home.lead}</p>
      </div>
      <div className="card-grid">
        <Link to="/competition" className="card card--primary">
          <span className="card__label">{ar.home.startQuiz}</span>
          <span className="card__hint">{ar.home.startQuizHint}</span>
        </Link>
      </div>
    </section>
  );
}
