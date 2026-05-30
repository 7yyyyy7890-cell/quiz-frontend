import '../styles/logo.css';
import { ar } from '../i18n/ar';

/**
 * شعار رمزي فقط — بدون نص.
 */
export default function Logo({ size = 48 }) {
  return (
    <div
      className="logo-symbol"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ar.logoAria}
    >
      <div className="logo-symbol__ring" />
      <div className="logo-symbol__core" />
      <div className="logo-symbol__accent" />
    </div>
  );
}
