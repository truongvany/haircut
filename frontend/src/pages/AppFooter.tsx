// frontend/src/components/AppFooter.tsx
import { Link } from 'react-router-dom';
import styles from '../components/AppFooter.module.css';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.copyright}>
          © {currentYear} Haircut. Bản Quyền Thuộc Về{' '}
          <a
            href="https://www.facebook.com/AtomicY1608/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.userName}
            >
            Trương Văn Ý
            </a>

        </div>

        <div className={styles.footerLinks}>
          <Link to="/about" className={styles.footerLink}>Về chúng tôi</Link>
          <Link to="/privacy" className={styles.footerLink}>Chính sách</Link>
          <Link to="/terms" className={styles.footerLink}>Điều khoản</Link>
          <Link to="/contact" className={styles.footerLink}>Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}
