import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <img src="/logo.png" alt="LabelIQ" />
        </div>
        <div className="footer-copyright">
          © 2025 LabelIQ. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#privacy" className="footer-link">Privacy</a>
          <a href="#terms" className="footer-link">Terms</a>
          <a href="#contact" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
